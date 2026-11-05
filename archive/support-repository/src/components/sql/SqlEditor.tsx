interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export default function SqlEditor({
  value,
  onChange,
  placeholder = "SELECT * FROM ...",
  readOnly = false,
}: SqlEditorProps) {
  const lineCount = value.split("\n").length || 1;

  return (
    <div className="flex overflow-hidden rounded-md border border-[#1F2733] bg-[#0B0F14]">
      <div
        aria-hidden
        className="select-none border-r border-[#1F2733] px-3 py-3 text-right font-mono text-xs leading-6 text-[#5B6675]"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck={false}
        className="min-h-[160px] w-full resize-none bg-transparent px-3 py-3 font-mono text-xs
          leading-6 text-[#E6EDF3] placeholder:text-[#5B6675] outline-none"
      />
    </div>
  );
}
