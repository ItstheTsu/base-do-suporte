import { useEffect, useState } from "react";
import UserService from "../services/UserService";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../models/UserModel";

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    UserService.list()
      .then(setUsers)
      .catch(() => setError("Erro ao carregar usuários."))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: string, role: "MASTER" | "USER") => {
    setUpdating(userId);
    try {
      const updated = await UserService.updateRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch {
      setError("Erro ao atualizar role.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-[#E6EDF3]">Usuários</h1>
        <p className="text-sm text-[#8B98A5]">Gerencie os papéis dos usuários do sistema.</p>
      </div>

      {error && <p className="text-xs text-[#F87171]">{error}</p>}

      {loading ? (
        <p className="text-sm text-[#5B6675]">Carregando...</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#1F2733]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#121821] text-xs uppercase tracking-wide text-[#5B6675]">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-[#1F2733] text-[#E6EDF3]">
                  <td className="px-4 py-3">
                    {u.name}
                    {u.id === me?.id && (
                      <span className="ml-2 text-xs text-[#5EEAD4]">(você)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#8B98A5]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "MASTER"
                          ? "bg-[#5EEAD4]/10 text-[#5EEAD4]"
                          : "bg-[#1F2733] text-[#8B98A5]"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id === me?.id ? (
                      <span className="text-xs text-[#5B6675]">—</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={updating === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as "MASTER" | "USER")}
                        className="rounded border border-[#1F2733] bg-[#0B0F14] px-2 py-1 text-xs text-[#E6EDF3] outline-none focus:border-[#5EEAD4]/60 disabled:opacity-50"
                      >
                        <option value="USER">USER</option>
                        <option value="MASTER">MASTER</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
