import { useEffect, useRef, useState } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar incidentes...",
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null >(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (next: string) => {
    setLocalValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(next), debounceMs);
  };

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div className="relative flex items-center">
      <svg
        className="pointer-events-none absolute left-3 h-4 w-4 text-[#5B6675]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#1F2733] bg-[#0B0F14] py-2 pl-9 pr-3 text-sm
          text-[#E6EDF3] placeholder:text-[#5B6675] outline-none transition-colors
          focus:border-[#5EEAD4]/60"
      />
    </div>
  );
}
