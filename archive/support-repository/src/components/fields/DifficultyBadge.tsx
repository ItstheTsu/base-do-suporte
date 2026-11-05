import type { IncidentDifficulty } from "../../models/IncidentModel";

const config: Record<IncidentDifficulty, { label: string; classes: string }> = {
  easy: { label: "Fácil", classes: "bg-[#34D399]/10 text-[#34D399] border-[#34D399]/30" },
  medium: { label: "Médio", classes: "bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/30" },
  hard: { label: "Difícil", classes: "bg-[#F87171]/10 text-[#F87171] border-[#F87171]/30" },
};

export default function DifficultyBadge({ difficulty }: { difficulty: IncidentDifficulty }) {
  const { label, classes } = config[difficulty];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
