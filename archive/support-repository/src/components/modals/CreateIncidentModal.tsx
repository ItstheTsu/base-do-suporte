import { useState, useEffect } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useIncidents } from "../../contexts/IncidentContext";
import type {
  IncidentDifficulty,
  IncidentDatabase,
} from "../../models/IncidentModel";
import TextField from "../inputs/TextField";
import TextArea from "../inputs/TextArea";
import SelectDifficulty from "../inputs/SelectDifficulty";
import AddTag from "../buttons/AddTag";
import FieldTag from "../fields/FieldTag";
import TagService from "../../services/TagService";
import type { Tag } from "../../models/TagModel";
import Button from "../buttons/Button";

const DATABASE_OPTIONS: { value: IncidentDatabase; label: string }[] = [
  { value: "myfront", label: "myfront" },
  { value: "myouro", label: "myouro" },
];

export default function CreateIncidentModal() {
  const { isOpen, closeModal } = useModal();
  const { createIncident } = useIncidents();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<IncidentDifficulty | "all">(
    "easy",
  );
  const [points, setPoints] = useState(10);
  const [database, setDatabase] = useState<IncidentDatabase>("myfront");
  const [sqlSeed, setSqlSeed] = useState("");
  const [sqlAnswer, setSqlAnswer] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = isOpen("createIncident");

  useEffect(() => {
    if (open)
      TagService.list()
        .then(setAllTags)
        .catch(() => setAllTags([]));
  }, [open]);

  if (!open) return null;

  const selectedTags = allTags.filter((t) => tagIds.includes(t.id));

  const reset = () => {
    setTitle("");
    setDescription("");
    setDifficulty("easy");
    setPoints(10);
    setDatabase("myfront");
    setSqlSeed("");
    setSqlAnswer("");
    setTagIds([]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Título e descrição são obrigatórios.");
      return;
    }
    if (!sqlAnswer.trim()) {
      setError("A query de resposta é obrigatória.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createIncident({
        title: title.trim(),
        description: description.trim(),
        difficulty: difficulty as IncidentDifficulty,
        points,
        database,
        tagIds,
        sqlSeed: sqlSeed.trim() || undefined,
        sqlAnswer: sqlAnswer.trim(),
      });
      reset();
      closeModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao criar incidente.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="flex w-full max-w-lg max-h-full overflow-auto flex-col gap-4 rounded-lg border border-[#1F2733] bg-[#121821] p-5">
        <h2 className="text-sm font-semibold text-[#E6EDF3]">Novo incidente</h2>

        <TextField
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Pedidos duplicados na tabela orders"
        />

        <TextArea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o cenário que o solver precisa investigar..."
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <SelectDifficulty
              label="Dificuldade"
              value={difficulty}
              onChange={setDifficulty}
            />
          </div>
          <div className="flex flex-col gap-1 w-28">
            <label className="text-xs font-medium text-[#8B98A5]">Pontos</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="rounded-md border border-[#1F2733] bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-[#5EEAD4]/60"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#8B98A5]">
            Banco de dados
          </span>
          <div className="flex gap-2">
            {DATABASE_OPTIONS.map((opt) => {
              const selected = database === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDatabase(opt.value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                    selected
                      ? "border-[#5EEAD4] bg-[#5EEAD4]/10 text-[#5EEAD4]"
                      : "border-[#1F2733] bg-[#0B0F14] text-[#8B98A5] hover:border-[#2A3441]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <TextArea
          label="Schema / dados de exemplo (opcional)"
          value={sqlSeed}
          onChange={(e) => setSqlSeed(e.target.value)}
          placeholder="CREATE TABLE orders (...);"
          rows={3}
        />

        <TextArea
          label="Query de resposta correta"
          value={sqlAnswer}
          onChange={(e) => setSqlAnswer(e.target.value)}
          placeholder="SELECT ... (query que o usuário deve escrever para resolver)"
          rows={3}
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[#8B98A5]">Tags</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedTags.map((tag) => (
              <FieldTag
                key={tag.id}
                tag={tag}
                onRemove={(id) =>
                  setTagIds((prev) => prev.filter((t) => t !== id))
                }
              />
            ))}
            <AddTag selectedTagIds={tagIds} onChange={setTagIds} />
          </div>
        </div>

        {error && <p className="text-xs text-[#F87171]">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              closeModal();
            }}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Criar incidente
          </Button>
        </div>
      </div>
    </div>
  );
}
