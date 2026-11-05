import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <span className="font-mono text-4xl font-bold text-[#5EEAD4]">404</span>
      <p className="text-sm text-[#8B98A5]">
        Erro: incidente de navegação. Essa rota não existe no banco.
      </p>
      <Link to="/" className="text-sm font-medium text-[#5EEAD4] hover:underline">
        Voltar para incidentes
      </Link>
    </div>
  );
}
