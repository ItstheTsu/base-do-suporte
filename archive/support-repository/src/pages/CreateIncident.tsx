import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useIncidents } from "../contexts/IncidentContext";
import type { IncidentDifficulty, IncidentDatabase } from "../models/IncidentModel";
import TextField from "../components/inputs/TextField";
import TextArea from "../components/inputs/TextArea";
import SelectDifficulty from "../components/inputs/SelectDifficulty";
import AddTag from "../components/buttons/AddTag";
import FieldTag from "../components/fields/FieldTag";
import TagService from "../services/TagService";
import type { Tag } from "../models/TagModel";
import Button from "../components/buttons/Button";

const DATABASE_OPTIONS: { value: IncidentDatabase; label: string }[] = [
  { value: "myfront", label: "myfront" },
  { value: "myouro", label: "myouro" },
];

export default function CreateIncident() {
  const navigate = useNavigate();
  const { createIncident } = useIncidents();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<IncidentDifficulty | "all">("easy");
  const [database, setDatabase] = useState<IncidentDatabase>("myfront");
  const [sqlSeed, setSqlSeed] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    TagService.list().then(setAllTags).catch(() => setAllTags([]));
  }, []);

  const selectedTags = allTags.filter((t) => tagIds.includes(t.id));

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Título e descrição são obrigatórios.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createIncident({
        title: title.trim(),
        description: description.trim(),
        difficulty: difficulty as IncidentDifficulty,
        database,
        tagIds,
        sqlSeed: sqlSeed.trim() || undefined,
      });
      navigate(`/incident/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar incidente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold text-[#E6EDF3]">Novo incidente</h1>

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

      <div className="grid grid-cols-2 gap-4">
        <SelectDifficulty label="Dificuldade" value={difficulty} onChange={setDifficulty} />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#8B98A5]">Banco de dados</span>
          <select
            value={database}
            onChange={(e) => setDatabase(e.target.value as IncidentDatabase)}
            className="rounded-md border border-[#2A3038] bg-[#0D1117] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-[#5EEAD4]"
          >
            {DATABASE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TextArea
        label="Schema / dados de exemplo (opcional)"
        value={sqlSeed}
        onChange={(e) => setSqlSeed(e.target.value)}
        placeholder="CREATE TABLE orders (...);"
        rows={4}
      />

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
        <Button variant="ghost" onClick={() => navigate("/")} disabled={submitting}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} loading={submitting}>
          Criar incidente
        </Button>
      </div>
    </div>
  );
}