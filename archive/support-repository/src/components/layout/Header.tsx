import { Link } from "react-router";
import { useSearch } from "../../contexts/SearchContext";
import { useAuth } from "../../contexts/AuthContext";
import SearchInput from "../inputs/SearchInput";
import AddIncident from "../buttons/AddIncident";

export default function Header() {
  const { term, setTerm } = useSearch();
  const { user, logout, isMaster } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-[#1F2733] bg-[#0B0F14]/95 px-6 py-3 backdrop-blur">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-sm font-bold tracking-tight text-[#5EEAD4]">{"</>"}</span>
        <span className="text-sm font-semibold text-[#E6EDF3]">IncidentSQL</span>
      </Link>

      <div className="flex-1 max-w-md">
        <SearchInput value={term} onChange={setTerm} />
      </div>

      <Link to="/ranking" className="text-sm font-medium text-[#8B98A5] hover:text-[#E6EDF3] shrink-0">
        Ranking
      </Link>

      {isMaster && <AddIncident />}

      {user && (
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
            <span className="text-xs font-medium text-[#E6EDF3]">{user.name}</span>
            <span className={`text-xs font-medium ${isMaster ? "text-[#5EEAD4]" : "text-[#8B98A5]"}`}>
              {user.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-[#1F2733] px-2.5 py-1.5 text-xs text-[#8B98A5] hover:border-[#5B6675] hover:text-[#E6EDF3] transition-colors"
          >
            Sair
          </button>
        </div>
      )}
    </header>
  );
}