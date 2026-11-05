import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Informe seu nome.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[#1F2733] bg-[#121821] p-6 flex flex-col gap-5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-[#5EEAD4]">{"</>"}</span>
          <span className="text-sm font-semibold text-[#E6EDF3]">IncidentSQL</span>
        </div>

        <div>
          <h1 className="text-base font-semibold text-[#E6EDF3]">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="text-sm text-[#8B98A5] mt-0.5">
            {mode === "login"
              ? "Acesse sua conta para resolver incidentes."
              : "Crie sua conta e comece a resolver."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {mode === "register" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#8B98A5]">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="rounded-md border border-[#1F2733] bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-[#5EEAD4]/60 placeholder:text-[#5B6675]"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#8B98A5]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="rounded-md border border-[#1F2733] bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-[#5EEAD4]/60 placeholder:text-[#5B6675]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#8B98A5]">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="rounded-md border border-[#1F2733] bg-[#0B0F14] px-3 py-2 text-sm text-[#E6EDF3] outline-none focus:border-[#5EEAD4]/60 placeholder:text-[#5B6675]"
            />
          </div>
        </div>

        {error && <p className="text-xs text-[#F87171]">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-md bg-[#5EEAD4] px-4 py-2 text-sm font-semibold text-[#0B0F14] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>

        <p className="text-center text-xs text-[#5B6675]">
          {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
            className="text-[#5EEAD4] hover:underline bg-transparent p-0"
          >
            {mode === "login" ? "Criar conta" : "Entrar"}
          </button>
        </p>

        {mode === "login" && (
          <p className="text-center text-xs text-[#5B6675]">
            Master padrão:{" "}
            <span className="text-[#8B98A5]">master@incidentsql.com / master123</span>
          </p>
        )}
      </div>
    </div>
  );
}
