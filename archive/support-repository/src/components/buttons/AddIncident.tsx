import { useModal } from "../../contexts/ModalContext";
import Button from "./Button";

export default function AddIncident() {
  const { openModal } = useModal();

  return (
    <Button variant="primary" onClick={() => openModal("createIncident")}>
      + Novo incidente
    </Button>
  );
}
