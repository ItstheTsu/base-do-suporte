import api from "./ApiConfig";
import type {
  CreateIncidentPayload,
  Incident,
  SqlRunResult,
  UpdateIncidentPayload,
} from "../models/IncidentModel";

export interface IncidentFilters {
  search?: string;
  status?: string;
  difficulty?: string;
  tagIds?: string[];
}

function buildParams(filters?: IncidentFilters) {
  if (!filters) return undefined;
  const { search, status, difficulty, tagIds } = filters;
  return {
    search: search || undefined,
    status: status || undefined,
    difficulty: difficulty || undefined,
    tags: tagIds?.length ? tagIds.join(",") : undefined,
  };
}

export const IncidentService = {
  async list(filters?: IncidentFilters): Promise<Incident[]> {
    const { data } = await api.get<Incident[]>("/incidents", {
      params: buildParams(filters),
    });
    return data;
  },

  async getById(id: string): Promise<Incident> {
    const { data } = await api.get<Incident>(`/incidents/${id}`);
    return data;
  },

  async create(payload: CreateIncidentPayload): Promise<Incident> {
    const { data } = await api.post<Incident>("/incidents", payload);
    return data;
  },

  async update(id: string, payload: UpdateIncidentPayload): Promise<Incident> {
    const { data } = await api.patch<Incident>(`/incidents/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/incidents/${id}`);
  },

  /** Executes a candidate SQL query against the incident's sandboxed dataset. */
  async runQuery(id: string, sqlQuery: string): Promise<SqlRunResult> {
    const { data } = await api.post<SqlRunResult>(`/incidents/${id}/run`, {
      sqlQuery,
    });
    return data;
  },

  /** Marks the incident resolved once a query satisfies the expected result. */
  async resolve(id: string, sqlQuery: string): Promise<Incident> {
    const { data } = await api.post<Incident>(`/incidents/${id}/resolve`, {
      sqlQuery,
    });
    return data;
  },
};

export default IncidentService;
