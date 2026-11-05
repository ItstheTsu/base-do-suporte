import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { lazy, Suspense, useEffect } from "react";
import { SupportSession } from "./Session";
import { useSupport } from "./session-context";
import Catalog from "./Catalog";
const ArticlePage = lazy(() => import("./ArticlePage"));
const SupportPage = lazy(() => import("./SupportPage"));
const ArticleEditor = lazy(() => import("./ArticleEditor"));

function Shell() {
  const { user } = useSupport();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className="kb-app">
      <a className="kb-skip" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="kb-header">
        <div className="kb-header-inner">
          <Link
            to="/"
            className="kb-brand"
            aria-label="Base do Suporte — início"
          >
            <span className="kb-logo" aria-hidden="true">
              b<span>.</span>
            </span>
            <span>
              Base do Suporte<small>Conhecimento que resolve.</small>
            </span>
          </Link>
          <nav aria-label="Navegação principal">
            <NavLink to="/" end>
              Artigos
            </NavLink>
            <a
              href="https://www.vsm.com.br/areadocliente/baseConhecimento"
              target="_blank"
              rel="noreferrer"
            >
              Base VSM ↗
            </a>
            <NavLink className="kb-support-link" to="/admin">
              {user ? "Administrar artigos" : "Área administrativa"}
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="conteudo">
        <Suspense fallback={<div className="kb-container kb-state" role="status">Carregando…</div>}><Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/artigos/novo" element={<ArticleEditor />} />
          <Route path="/artigos/:slug/editar" element={<ArticleEditor />} />
          <Route path="/artigos/:slug" element={<ArticlePage />} />
          <Route path="/admin" element={<SupportPage />} />
          <Route path="/admin/novo" element={<ArticleEditor />} />
          <Route path="/admin/artigos/:id" element={<ArticleEditor />} />
          <Route path="/suporte" element={<Navigate to="/admin" replace />} />
          <Route
            path="*"
            element={
              <div className="kb-container kb-state">
                <h1>Página não encontrada</h1>
                <Link to="/">Voltar para os artigos</Link>
              </div>
            }
          />
        </Routes></Suspense>
      </main>
      <footer className="kb-footer">
        <div className="kb-container">
          <span>
            Base do Suporte <span className="kb-dot">•</span> Rotinas, erros e
            soluções.
          </span>
          <span>Conteúdo com fontes e contexto de aplicação.</span>
        </div>
      </footer>
    </div>
  );
}
export default function KnowledgeApp() {
  return (
    <SupportSession>
      <Shell />
    </SupportSession>
  );
}
