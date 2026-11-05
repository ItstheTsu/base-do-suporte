import api from "./ApiConfig";
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "../models/UserModel";

export const AuthService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/users/me");
    return data;
  },

  async logout(token: string): Promise<void> {
    await api.post("/auth/logout", null, { params: { token } });
  },
};

export default AuthService;
