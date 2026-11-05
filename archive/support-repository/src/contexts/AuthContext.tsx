import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User, LoginPayload, RegisterPayload } from "../models/UserModel";
import AuthService from "../services/AuthService";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isMaster: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    AuthService.me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("auth_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { token: t, user: u } = await AuthService.login(payload);
    localStorage.setItem("auth_token", t);
    setToken(t);
    setUser(u);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { token: t, user: u } = await AuthService.register(payload);
    localStorage.setItem("auth_token", t);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    if (token) await AuthService.logout(token).catch(() => {});
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  }, [token]);

  const isMaster = user?.role === "MASTER";

  const value = useMemo(
    () => ({ user, token, loading, isMaster, login, register, logout }),
    [user, token, loading, isMaster, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
