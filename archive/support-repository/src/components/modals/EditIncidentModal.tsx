import { useEffect, useState } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useIncidents } from "../../contexts/IncidentContext";
import type { Incident, IncidentDifficulty, IncidentStatus } from "../../models/IncidentModel";
import TextField from "../inputs/TextField";
import TextArea from "../inputs/TextArea";
import SelectDifficulty from "../inputs/SelectDifficulty";
import AddTag from "../buttons/AddTag";
import FieldTag from "../fields/FieldTag";
import TagService from "../../services/TagService";
import type { Tag } from "../../models/TagModel";
import Button from "../buttons/Button";

export default function EditIncidentModal() {
  const { isOpen, payload, closeModal } = useModal();
  const { updateIncident } = useIncidents();

  const open = isOpen("editIncident");
  const incident = (payload as { incident: Incident } | undefined)?.incident;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IncidentStatus>("open");
  const [difficulty, setDifficulty] = useState<IncidentDifficulty | "all">("easy");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incident) return;
    setTitle(incident.title);
    setDescription(incident.description);
    setStatus(incident.status);
    setDifficulty(incident.difficulty);
    setTagIds(incident.tags?.map((t) => t.id) ?? []);
  }, [incident]);

  useEffect(() => {
    if (open) TagService.list().then(setAllTags).catch(() => setAllTags([]));
  }, [open]);

  if (!open || !incident) return null;

  const selectedTags = allTags.filter((t) => tagIds.includes(t.id));

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Título e descrição são obrigatórios.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateIncident(incident.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        difficulty: difficulty as IncidentDifficulty,
        tagIds,
      });
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar incidente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-lg border border-[#1F2733] bg-[#121821] p-5">
        <h2 className="text-sm font-semibold text-[#E6EDF3]">Editar incidente</h2>

        <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />

        <TextArea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#8B98A5]">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IncidentStatus)}
              className="rounded-md border border-[#1F2733] bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-[#5EEAD4]/60"
            >
              <option value="open">Aberto</option>
              <option value="in_progress">Em andamento</option>
              <option value="resolved">Resolvido</option>
            </select>
          </div>

          <SelectDifficulty label="Dificuldade" value={difficulty} onChange={setDifficulty} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[#8B98A5]">Tags</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedTags.map((tag) => (
              <FieldTag
                key={tag.id}
                tag={tag}
                onRemove={(id) => setTagIds((prev) => prev.filter((t) => t !== id))}
              />
            ))}
            <AddTag selectedTagIds={tagIds} onChange={setTagIds} />
          </div>
        </div>

        {error && <p className="text-xs text-[#F87171]">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={closeModal} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
