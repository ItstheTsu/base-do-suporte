import { useEffect, useState } from "react";
import api from "../services/ApiConfig";
import Loading from "../components/Loading";

interface RankingEntry {
  userId: string;
  name: string;
  avatarUrl?: string;
  resolvedCount: number;
  points: number;
}

export default function Ranking() {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<RankingEntry[]>("/ranking")
      .then(({ data }) => setEntries(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar ranking"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading fullScreen label="Carregando ranking" />;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-[#E6EDF3]">Ranking</h1>
        <p className="text-sm text-[#8B98A5]">Quem mais resolveu incidentes com SQL.</p>
      </div>

      {error && <p className="text-sm text-[#F87171]">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-[#1F2733]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#121821] text-xs uppercase tracking-wide text-[#5B6675]">
            <tr>
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Solver</th>
              <th className="px-4 py-2 font-medium">Resolvidos</th>
              <th className="px-4 py-2 font-medium">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={entry.userId} className="border-t border-[#1F2733] text-[#E6EDF3]">
                <td className="px-4 py-2 font-mono text-[#5EEAD4]">{i + 1}</td>
                <td className="px-4 py-2">{entry.name}</td>
                <td className="px-4 py-2">{entry.resolvedCount}</td>
                <td className="px-4 py-2 font-mono">{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
