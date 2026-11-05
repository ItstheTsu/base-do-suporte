import { useModal } from "../../contexts/ModalContext";
import Button from "./Button";

interface AddTagProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export default function AddTag({ selectedTagIds, onChange }: AddTagProps) {
  const { openModal } = useModal();

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => openModal("searchTags", { selectedTagIds, onChange })}
    >
      + Tag
    </Button>
  );
}
