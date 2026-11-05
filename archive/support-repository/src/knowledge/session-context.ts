import { createContext, useContext } from "react";
import type { Session } from "./types";

export interface SessionValue extends Session {
  ready: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}
export const SessionContext = createContext<SessionValue | null>(null);
export function useSupport() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("Contexto de suporte ausente.");
  return context;
}
