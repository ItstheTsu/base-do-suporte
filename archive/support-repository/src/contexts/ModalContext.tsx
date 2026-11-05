import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { Incident } from "../models/IncidentModel";

export type ModalName =
  | "createIncident"
  | "editIncident"
  | "incidentPreview"
  | "searchTags"
  | "confirmDelete"
  | null;

interface ConfirmDeletePayload {
  title: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
}

interface ModalPayloads {
  createIncident: undefined;
  editIncident: { incident: Incident };
  incidentPreview: { incident: Incident };
  searchTags: { selectedTagIds: string[]; onChange: (tagIds: string[]) => void };
  confirmDelete: ConfirmDeletePayload;
}

interface ModalContextValue {
  activeModal: ModalName;
  payload: unknown;
  isOpen: (name: ModalName) => boolean;
  openModal: <T extends keyof ModalPayloads>(name: T, payload?: ModalPayloads[T]) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalName>(null);
  const [payload, setPayload] = useState<unknown>(undefined);

  const openModal = <T extends keyof ModalPayloads>(name: T, modalPayload?: ModalPayloads[T]) => {
    setActiveModal(name);
    setPayload(modalPayload);
  };

  const closeModal = () => {
    setActiveModal(null);
    setPayload(undefined);
  };

  const isOpen = (name: ModalName) => activeModal === name;

  const value = useMemo(
    () => ({ activeModal, payload, isOpen, openModal, closeModal }),
    [activeModal, payload]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within a ModalProvider");
  return ctx;
}

export type { ModalPayloads };
