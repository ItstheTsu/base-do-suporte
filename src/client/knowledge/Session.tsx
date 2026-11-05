import { useCallback, useEffect, useState, type ReactNode } from "react";
import { request } from "./api";
import type { Session } from "./types";
import { SessionContext } from "./session-context";
export function SupportSession({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({
    user: null,
    loginEnabled: false,
  });
  const [ready, setReady] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setSession(await request<Session>("/session"));
    } catch {
      setSession({ user: null, loginEnabled: false });
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const logout = async () => {
    await request("/session", { method: "DELETE", body: "{}" });
    await refresh();
  };
  return (
    <SessionContext.Provider value={{ ...session, ready, refresh, logout }}>
      {children}
    </SessionContext.Provider>
  );
}
