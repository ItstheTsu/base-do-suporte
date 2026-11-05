import type { IncidentStatus } from "../../models/IncidentModel";

const config: Record<IncidentStatus, { label: string; classes: string }> = {
  open: { label: "Aberto", classes: "bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/30" },
  in_progress: {
    label: "Em andamento",
    classes: "bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/30",
  },
  resolved: { label: "Resolvido", classes: "bg-[#34D399]/10 text-[#34D399] border-[#34D399]/30" },
};

export default function StatusBadge({ status }: { status: IncidentStatus }) {
  const { label, classes } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
