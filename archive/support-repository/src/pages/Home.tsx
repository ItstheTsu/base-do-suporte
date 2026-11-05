import { useEffect, useMemo } from "react";
import { useIncidents } from "../contexts/IncidentContext";
import { useSearch } from "../contexts/SearchContext";
import { useModal } from "../contexts/ModalContext";
import IncidentCard from "../components/cards/IncidentCard";
import Loading from "../components/Loading";

export default function Home() {
  const { incidents, loading, error, fetchIncidents } = useIncidents();
  const { term, status, difficulty, tagIds } = useSearch();
  const { openModal } = useModal();

  useEffect(() => {
    fetchIncidents({
      search: term,
      status: status === "all" ? undefined : status,
      difficulty: difficulty === "all" ? undefined : difficulty,
      tagIds,
    });
  }, [term, status, difficulty, tagIds, fetchIncidents]);

  const isEmpty = useMemo(() => !loading && incidents.length === 0, [loading, incidents]);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-[#E6EDF3]">Incidentes</h1>
        <p className="text-sm text-[#8B98A5]">
          Escolha um incidente e escreva a query SQL que resolve o caso.
        </p>
      </div>

      {loading && <Loading label="Carregando incidentes" />}
      {error && <p className="text-sm text-[#F87171]">{error}</p>}

      {isEmpty && (
        <p className="text-sm text-[#5B6675]">Nenhum incidente encontrado com esses filtros.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {incidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            onClick={(inc) => openModal("incidentPreview", { incident: inc })}
          />
        ))}
      </div>
    </div>
  );
}
