import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useIncidents } from "../contexts/IncidentContext";
import DifficultyBadge from "../components/fields/DifficultyBadge";
import StatusBadge from "../components/fields/StatusBadge";
import FieldTag from "../components/fields/FieldTag";
import SqlConsole from "../components/sql/SqlConsole";
import Loading from "../components/Loading";
import Button from "../components/buttons/Button";

export default function Incident() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedIncident, loading, error, fetchIncidentById, updateIncident } = useIncidents();

  useEffect(() => {
    if (id) fetchIncidentById(id);
  }, [id, fetchIncidentById]);

  if (loading) return <Loading fullScreen label="Carregando incidente" />;

  if (error || !selectedIncident) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-sm text-[#F87171]">{error ?? "Incidente não encontrado."}</p>
        <Button variant="secondary" onClick={() => navigate("/")}>
          Voltar para incidentes
        </Button>
      </div>
    );
  }

  const incident = selectedIncident;

  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <h1 className="text-lg font-semibold text-[#E6EDF3]">{incident.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={incident.status} />
          <DifficultyBadge difficulty={incident.difficulty} />
          <span className="font-mono text-xs text-[#5EEAD4]">+{incident.points}pt</span>
        </div>
      </div>

      <p className="max-w-2xl text-sm text-[#8B98A5]">{incident.description}</p>

      {incident.tags && incident.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {incident.tags.map((tag) => (
            <FieldTag key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      <div className="max-w-2xl">
        <SqlConsole
          incident={incident}
          onResolved={(updated) => updateIncident(updated.id, { status: "resolved" })}
        />
      </div>
    </div>
  );
}
