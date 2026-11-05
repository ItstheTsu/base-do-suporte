import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { useSearch } from "../../contexts/SearchContext";
import { useAuth } from "../../contexts/AuthContext";
import TagService from "../../services/TagService";
import type { Tag } from "../../models/TagModel";
import SelectDifficulty from "../inputs/SelectDifficulty";

export default function Sidebar() {
  const { status, setStatus, difficulty, setDifficulty, tagIds, toggleTag } = useSearch();
  const { isMaster } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    TagService.list()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const navItems = [
    { to: "/", label: "Incidentes" },
    { to: "/ranking", label: "Ranking" },
    ...(isMaster
      ? [
          { to: "/tags", label: "Tags" },
          { to: "/users", label: "Usuários" },
        ]
      : []),
  ];

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-[#1F2733] bg-[#0B0F14] p-4 md:flex">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#121821] text-[#5EEAD4]"
                  : "text-[#8B98A5] hover:bg-[#121821] hover:text-[#E6EDF3]"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5B6675]">Status</p>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-md border border-[#1F2733] bg-[#121821] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-[#5EEAD4]/60"
        >
          <option value="all">Todos</option>
          <option value="open">Aberto</option>
          <option value="in_progress">Em andamento</option>
          <option value="resolved">Resolvido</option>
        </select>

        <SelectDifficulty value={difficulty} onChange={setDifficulty} includeAll />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5B6675]">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const active = tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "border-[#5EEAD4]/60 bg-[#5EEAD4]/10 text-[#5EEAD4]"
                    : "border-[#1F2733] text-[#8B98A5] hover:text-[#E6EDF3]"
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}