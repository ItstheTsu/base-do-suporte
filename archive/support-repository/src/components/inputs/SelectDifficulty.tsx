import type { SelectHTMLAttributes } from "react";
import type { IncidentDifficulty } from "../../models/IncidentModel";

interface SelectDifficultyProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  label?: string;
  value: IncidentDifficulty | "all";
  onChange: (value: IncidentDifficulty | "all") => void;
  includeAll?: boolean;
}

const options: Array<{ value: IncidentDifficulty; label: string }> = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Médio" },
  { value: "hard", label: "Difícil" },
];

export default function SelectDifficulty({
  label,
  value,
  onChange,
  includeAll = false,
  id,
  className = "",
  ...rest
}: SelectDifficultyProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[#8B98A5]">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as IncidentDifficulty | "all")}
        className={`rounded-md border border-[#1F2733] bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3]
          outline-none transition-colors focus:border-[#5EEAD4]/60 ${className}`}
        {...rest}
      >
        {includeAll && <option value="all">Todas as dificuldades</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
