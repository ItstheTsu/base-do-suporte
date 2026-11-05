import { useEffect, useState } from "react";
import TagService from "../services/TagService";
import type { Tag } from "../models/TagModel";
import Button from "../components/buttons/Button";

const PRESET_COLORS = [
  "#5EEAD4", "#34d399", "#fbbf24", "#f87171",
  "#a78bfa", "#60a5fa", "#f472b6", "#fb923c",
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New tag form
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  useEffect(() => {
    TagService.list()
      .then(setTags)
      .catch(() => setError("Erro ao carregar tags."))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const tag = await TagService.create({ name: newName.trim(), color: newColor });
      setTags((prev) => [...prev, tag]);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
    } catch {
      setError("Erro ao criar tag.");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color ?? PRESET_COLORS[0]);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const updated = await TagService.update(id, { name: editName.trim(), color: editColor });
      setTags((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
    } catch {
      setError("Erro ao atualizar tag.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta tag?")) return;
    try {
      await TagService.remove(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Erro ao excluir tag.");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-[#E6EDF3]">Tags</h1>
        <p className="text-sm text-[#8B98A5]">Gerencie as tags dos incidentes.</p>
      </div>

      {/* Create form */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#1F2733] bg-[#121821] p-4">
        <h2 className="text-sm font-semibold text-[#E6EDF3]">Nova tag</h2>
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-medium text-[#8B98A5]">Nome</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Ex: Performance"
              className="rounded-md border border-[#1F2733] bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-[#5EEAD4]/60 placeholder:text-[#5B6675]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#8B98A5]">Cor</label>
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    newColor === c ? "border-white scale-110" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newName && (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: newColor + "22", color: newColor, border: `1px solid ${newColor}55` }}
            >
              {newName}
            </span>
          )}
          <Button variant="primary" onClick={handleCreate} loading={creating} size="sm">
            Criar tag
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-[#F87171]">{error}</p>}

      {/* Tags list */}
      {loading ? (
        <p className="text-sm text-[#5B6675]">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tags.map((tag) =>
            editingId === tag.id ? (
              <div key={tag.id} className="flex items-center gap-3 rounded-lg border border-[#5EEAD4]/30 bg-[#121821] p-3">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded border border-[#1F2733] bg-[#0B0F14] px-2 py-1 text-sm text-[#E6EDF3] outline-none focus:border-[#5EEAD4]/60 flex-1"
                />
                <div className="flex gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border-2 ${editColor === c ? "border-white" : "border-transparent"}`}
                    />
                  ))}
                </div>
                <Button variant="primary" size="sm" onClick={() => handleSaveEdit(tag.id)}>Salvar</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
              </div>
            ) : (
              <div key={tag.id} className="flex items-center gap-3 rounded-lg border border-[#1F2733] bg-[#121821] p-3">
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: (tag.color ?? "#5EEAD4") + "22", color: tag.color ?? "#5EEAD4", border: `1px solid ${(tag.color ?? "#5EEAD4")}55` }}
                >
                  {tag.name}
                </span>
                <span className="text-xs text-[#5B6675] font-mono">{tag.color}</span>
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(tag)}>Editar</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(tag.id)}>Excluir</Button>
                </div>
              </div>
            )
          )}
          {tags.length === 0 && <p className="text-sm text-[#5B6675]">Nenhuma tag cadastrada.</p>}
        </div>
      )}
    </div>
  );
}
