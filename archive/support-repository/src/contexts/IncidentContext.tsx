import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Incident, CreateIncidentPayload, UpdateIncidentPayload } from "../models/IncidentModel";
import IncidentService, { type IncidentFilters } from "../services/IncidentService";

interface IncidentContextValue {
  incidents: Incident[];
  selectedIncident: Incident | null;
  loading: boolean;
  error: string | null;
  fetchIncidents: (filters?: IncidentFilters) => Promise<void>;
  fetchIncidentById: (id: string) => Promise<void>;
  createIncident: (payload: CreateIncidentPayload) => Promise<Incident>;
  updateIncident: (id: string, payload: UpdateIncidentPayload) => Promise<Incident>;
  deleteIncident: (id: string) => Promise<void>;
  selectIncident: (incident: Incident | null) => void;
}

const IncidentContext = createContext<IncidentContextValue | undefined>(undefined);

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async (filters?: IncidentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await IncidentService.list(filters);
      setIncidents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIncidentById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await IncidentService.getById(id);
      setSelectedIncident(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incident");
    } finally {
      setLoading(false);
    }
  }, []);

  const createIncident = useCallback(async (payload: CreateIncidentPayload) => {
    const created = await IncidentService.create(payload);
    setIncidents((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateIncident = useCallback(async (id: string, payload: UpdateIncidentPayload) => {
    const updated = await IncidentService.update(id, payload);
    setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setSelectedIncident((prev) => (prev?.id === id ? updated : prev));
    return updated;
  }, []);

  const deleteIncident = useCallback(async (id: string) => {
    await IncidentService.remove(id);
    setIncidents((prev) => prev.filter((i) => i.id !== id));
    setSelectedIncident((prev) => (prev?.id === id ? null : prev));
  }, []);

  const selectIncident = useCallback((incident: Incident | null) => {
    setSelectedIncident(incident);
  }, []);

  const value = useMemo(
    () => ({
      incidents,
      selectedIncident,
      loading,
      error,
      fetchIncidents,
      fetchIncidentById,
      createIncident,
      updateIncident,
      deleteIncident,
      selectIncident,
    }),
    [
      incidents,
      selectedIncident,
      loading,
      error,
      fetchIncidents,
      fetchIncidentById,
      createIncident,
      updateIncident,
      deleteIncident,
      selectIncident,
    ]
  );

  return <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>;
}

export function useIncidents() {
  const ctx = useContext(IncidentContext);
  if (!ctx) throw new Error("useIncidents must be used within an IncidentProvider");
  return ctx;
}
