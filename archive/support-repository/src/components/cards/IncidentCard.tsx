import type { Incident } from "../../models/IncidentModel";
import DifficultyBadge from "../fields/DifficultyBadge";
import StatusBadge from "../fields/StatusBadge";
import FieldTag from "../fields/FieldTag";

interface IncidentCardProps {
  incident: Incident;
  onClick?: (incident: Incident) => void;
}

export default function IncidentCard({ incident, onClick }: IncidentCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(incident)}
      className="flex w-full flex-col gap-3 rounded-lg border border-[#1F2733] bg-[#121821] p-4
        text-left transition-colors hover:border-[#5EEAD4]/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#E6EDF3] line-clamp-1">{incident.title}</h3>
        <span className="shrink-0 font-mono text-xs text-[#5EEAD4]">+{incident.points}pt</span>
      </div>

      <p className="text-sm text-[#8B98A5] line-clamp-2">{incident.description}</p>

      <div className="flex items-center gap-2">
        <StatusBadge status={incident.status} />
        <DifficultyBadge difficulty={incident.difficulty} />
      </div>

      {incident.tags && incident.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {incident.tags.map((tag) => (
            <FieldTag key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </button>
  );
}
