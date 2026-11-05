import type { Tag } from "./TagModel";

export type IncidentDifficulty = "easy" | "medium" | "hard";

export type IncidentStatus = "open" | "in_progress" | "resolved";

export type IncidentDatabase = "myfront" | "myouro";

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  difficulty: IncidentDifficulty;
  database: IncidentDatabase;
  tags: Tag[];
  sqlSeed?: string;
  sqlQuery?: string;
  points: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  difficulty: IncidentDifficulty;
  database?: IncidentDatabase;
  tagIds: string[];
  sqlSeed?: string;
  sqlAnswer?: string;
  points?: number;
}

export interface UpdateIncidentPayload {
  title?: string;
  description?: string;
  status?: IncidentStatus;
  difficulty?: IncidentDifficulty;
  database?: IncidentDatabase;
  tagIds?: string[];
  sqlSeed?: string;
  sqlAnswer?: string;
  points?: number;
}

export interface SqlRunResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  durationMs: number;
  error?: string;
}