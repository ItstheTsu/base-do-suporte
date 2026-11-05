import { useState } from "react";
import type { Incident, SqlRunResult } from "../../models/IncidentModel";
import IncidentService from "../../services/IncidentService";
import SqlToolbar from "./SqlToolbar";
import SqlEditor from "./SqlEditor";
import SqlResult from "./SqlResult";
import Button from "../buttons/Button";

interface SqlConsoleProps {
  incident: Incident;
  onResolved?: (incident: Incident) => void;
}

export default function SqlConsole({ incident, onResolved }: SqlConsoleProps) {
  const [query, setQuery] = useState(incident.sqlQuery ?? "");
  const [result, setResult] = useState<SqlRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [resolving, setResolving] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    try {
      const data = await IncidentService.runQuery(incident.id, query);
      setResult(data);
    } catch (err) {
      setResult({
        columns: [],
        rows: [],
        rowCount: 0,
        durationMs: 0,
        error: err instanceof Error ? err.message : "Falha ao executar query",
      });
    } finally {
      setRunning(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      const updated = await IncidentService.resolve(incident.id, query);
      onResolved?.(updated);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {incident.sqlSeed && (
        <pre className="overflow-auto rounded-md border border-[#1F2733] bg-[#0B0F14] px-3 py-2 font-mono text-xs text-[#8B98A5]">
          {incident.sqlSeed}
        </pre>
      )}

      <div>
        <SqlToolbar onRun={handleRun} onClear={() => setQuery("")} running={running} />
        <SqlEditor value={query} onChange={setQuery} />
        <SqlResult result={result} />
      </div>

      {incident.status !== "resolved" && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleResolve} loading={resolving} disabled={!query}>
            Marcar como resolvido
          </Button>
        </div>
      )}
    </div>
  );
}
