import type { SqlRunResult } from "../../models/IncidentModel";

interface SqlResultProps {
  result: SqlRunResult | null;
}

export default function SqlResult({ result }: SqlResultProps) {
  if (!result) {
    return (
      <div className="rounded-b-md border border-t-0 border-[#1F2733] bg-[#0B0F14] px-4 py-6 text-center text-xs text-[#5B6675]">
        Execute uma query para ver o resultado aqui.
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="rounded-b-md border border-t-0 border-[#1F2733] bg-[#0B0F14] px-4 py-3 font-mono text-xs text-[#F87171]">
        Erro: {result.error}
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-b-md border border-t-0 border-[#1F2733] bg-[#0B0F14]">
      <table className="w-full text-left font-mono text-xs">
        <thead className="border-b border-[#1F2733] text-[#5EEAD4]">
          <tr>
            {result.columns.map((col) => (
              <th key={col} className="px-3 py-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i} className="border-b border-[#1F2733]/60 text-[#E6EDF3]">
              {result.columns.map((col) => (
                <td key={col} className="px-3 py-1.5 whitespace-nowrap">
                  {String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between px-3 py-2 text-[10px] text-[#5B6675]">
        <span>{result.rowCount} linha(s)</span>
        <span>{result.durationMs}ms</span>
      </div>
    </div>
  );
}
