import Button from "../buttons/Button";

interface SqlToolbarProps {
  onRun: () => void;
  onClear: () => void;
  onFormat?: () => void;
  running?: boolean;
}

export default function SqlToolbar({ onRun, onClear, onFormat, running = false }: SqlToolbarProps) {
  return (
    <div className="flex items-center justify-between rounded-t-md border border-b-0 border-[#1F2733] bg-[#121821] px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]/70" />
        <span className="ml-2 font-mono text-xs text-[#5B6675]">console.sql</span>
      </div>

      <div className="flex items-center gap-2">
        {onFormat && (
          <Button variant="ghost" size="sm" onClick={onFormat}>
            Formatar
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onClear}>
          Limpar
        </Button>
        <Button variant="primary" size="sm" onClick={onRun} loading={running}>
          Executar
        </Button>
      </div>
    </div>
  );
}
