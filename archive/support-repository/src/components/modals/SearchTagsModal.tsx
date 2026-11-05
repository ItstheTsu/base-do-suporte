import { useEffect, useState } from "react";
import { useModal } from "../../contexts/ModalContext";
import TagService from "../../services/TagService";
import type { Tag } from "../../models/TagModel";
import TextField from "../inputs/TextField";
import Button from "../buttons/Button";

export default function SearchTagsModal() {
  const { isOpen, payload, closeModal } = useModal();
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const open = isOpen("searchTags");
  const { selectedTagIds, onChange } = (payload as {
    selectedTagIds: string[];
    onChange: (tagIds: string[]) => void;
  }) ?? { selectedTagIds: [], onChange: () => {} };

  useEffect(() => {
    if (open) setSelected(selectedTagIds);
  }, [open, selectedTagIds]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    TagService.list(search)
      .then(setTags)
      .finally(() => setLoading(false));
  }, [open, search]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleConfirm = () => {
    onChange(selected);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-[#1F2733] bg-[#121821] p-5">
        <h2 className="text-sm font-semibold text-[#E6EDF3]">Selecionar tags</h2>

        <TextField
          placeholder="Buscar tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex max-h-56 flex-col gap-1 overflow-auto">
          {loading && <p className="text-xs text-[#5B6675]">Carregando...</p>}
          {!loading && tags.length === 0 && (
            <p className="text-xs text-[#5B6675]">Nenhuma tag encontrada.</p>
          )}
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#E6EDF3] hover:bg-[#0B0F14]"
            >
              <input
                type="checkbox"
                checked={selected.includes(tag.id)}
                onChange={() => toggle(tag.id)}
                className="accent-[#5EEAD4]"
              />
              {tag.name}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={closeModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
