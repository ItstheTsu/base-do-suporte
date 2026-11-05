import { useModal } from "../../contexts/ModalContext";
import { useIncidents } from "../../contexts/IncidentContext";
import { useAuth } from "../../contexts/AuthContext";
import type { Incident } from "../../models/IncidentModel";
import DifficultyBadge from "../fields/DifficultyBadge";
import StatusBadge from "../fields/StatusBadge";
import FieldTag from "../fields/FieldTag";
import SqlConsole from "../sql/SqlConsole";
import Button from "../buttons/Button";

export default function IncidentPreviewModal() {
  const { isOpen, payload, closeModal, openModal } = useModal();
  const { deleteIncident, updateIncident } = useIncidents();
  const { isMaster } = useAuth();

  const open = isOpen("incidentPreview");
  const incident = (payload as { incident: Incident } | undefined)?.incident;

  if (!open || !incident) return null;

  const handleDelete = () => {
    openModal("confirmDelete", {
      title: `Excluir "${incident.title}"?`,
      description: "Essa ação não pode ser desfeita.",
      onConfirm: async () => {
        await deleteIncident(incident.id);
        closeModal();
      },
    });
  };

  const handleResolved = async (updated: Incident) => {
    await updateIncident(updated.id, { status: "resolved" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="flex max-h-full w-full max-w-2xl flex-col gap-4 overflow-auto rounded-lg border border-[#1F2733] bg-[#121821] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#E6EDF3]">{incident.title}</h2>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={incident.status} />
              <DifficultyBadge difficulty={incident.difficulty} />
              <span className="font-mono text-xs text-[#5EEAD4]">+{incident.points}pt</span>
            </div>
          </div>
          <button
            onClick={closeModal}
            aria-label="Fechar"
            className="text-[#8B98A5] hover:text-[#E6EDF3] text-xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-[#8B98A5]">{incident.description}</p>

        {incident.tags && incident.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {incident.tags.map((tag) => (
              <FieldTag key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        <SqlConsole incident={incident} onResolved={handleResolved} />

        {isMaster && (
          <div className="flex justify-end gap-2 border-t border-[#1F2733] pt-3">
            <Button variant="danger" onClick={handleDelete}>
              Excluir
            </Button>
            <Button variant="secondary" onClick={() => openModal("editIncident", { incident })}>
              Editar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}