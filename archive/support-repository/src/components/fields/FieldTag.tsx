import type { Tag } from "../../models/TagModel";

interface FieldTagProps {
  tag: Tag;
  onRemove?: (tagId: string) => void;
}

export default function FieldTag({ tag, onRemove }: FieldTagProps) {
  const color = tag.color ?? "#5EEAD4";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}1A`,
        borderColor: `${color}4D`,
        color,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(tag.id)}
          aria-label={`Remover tag ${tag.name}`}
          className="leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}
