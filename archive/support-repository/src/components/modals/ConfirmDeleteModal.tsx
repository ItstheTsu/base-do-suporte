import { useState } from "react";
import { useModal } from "../../contexts/ModalContext";
import Button from "../buttons/Button";

export default function ConfirmDeleteModal() {
  const { isOpen, payload, closeModal } = useModal();
  const [loading, setLoading] = useState(false);

  if (!isOpen("confirmDelete")) return null;

  const { title, description, onConfirm } = payload as {
    title: string;
    description?: string;
    onConfirm: () => void | Promise<void>;
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg border border-[#1F2733] bg-[#121821] p-5">
        <h2 className="text-sm font-semibold text-[#E6EDF3]">{title}</h2>
        {description && <p className="mt-2 text-sm text-[#8B98A5]">{description}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={closeModal} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={loading}>
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}
