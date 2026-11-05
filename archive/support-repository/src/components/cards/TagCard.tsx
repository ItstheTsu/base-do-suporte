import type { Tag } from "../../models/TagModel";

interface TagCardProps {
  tag: Tag;
  onEdit?: (tag: Tag) => void;
  onDelete?: (tag: Tag) => void;
}

export default function TagCard({ tag, onEdit, onDelete }: TagCardProps) {
  const color = tag.color ?? "#5EEAD4";

  return (
    <div className="flex items-center justify-between rounded-lg border border-[#1F2733] bg-[#121821] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <div>
          <p className="text-sm font-medium text-[#E6EDF3]">{tag.name}</p>
          {typeof tag.incidentCount === "number" && (
            <p className="text-xs text-[#8B98A5]">{tag.incidentCount} incidente(s)</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(tag)}
            className="rounded-md px-2 py-1 text-xs text-[#8B98A5] hover:text-[#E6EDF3]"
          >
            Editar
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(tag)}
            className="rounded-md px-2 py-1 text-xs text-[#F87171] hover:text-[#FF8A8A]"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}
