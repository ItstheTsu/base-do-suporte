import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { IncidentDifficulty, IncidentStatus } from "../models/IncidentModel";

interface SearchContextValue {
  term: string;
  setTerm: (term: string) => void;
  status: IncidentStatus | "all";
  setStatus: (status: IncidentStatus | "all") => void;
  difficulty: IncidentDifficulty | "all";
  setDifficulty: (difficulty: IncidentDifficulty | "all") => void;
  tagIds: string[];
  toggleTag: (tagId: string) => void;
  clearTags: () => void;
  reset: () => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<IncidentStatus | "all">("all");
  const [difficulty, setDifficulty] = useState<IncidentDifficulty | "all">("all");
  const [tagIds, setTagIds] = useState<string[]>([]);

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const clearTags = () => setTagIds([]);

  const reset = () => {
    setTerm("");
    setStatus("all");
    setDifficulty("all");
    setTagIds([]);
  };

  const value = useMemo(
    () => ({
      term,
      setTerm,
      status,
      setStatus,
      difficulty,
      setDifficulty,
      tagIds,
      toggleTag,
      clearTags,
      reset,
    }),
    [term, status, difficulty, tagIds]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within a SearchProvider");
  return ctx;
}
