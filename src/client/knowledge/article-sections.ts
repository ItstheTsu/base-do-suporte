import type { ProcedureKind, ProcedureSection } from "./types";

export function procedureKind(section: ProcedureSection): ProcedureKind {
  if (section.kind) return section.kind;
  const hasSteps = section.steps.some(step => step.trim());
  return !hasSteps && section.images.length > 0 ? "images" : "steps";
}

export const sections = [
  ["sintomas", "Quando acontece"],
  ["causa", "O que verificar"],
  ["procedimento", "Como proceder"],
  ["validacao", "Como validar"],
  ["cuidados", "Cuidados"],
  ["fontes", "Fontes e referências"],
] as const;
