import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { formatDate, queryString, request } from "./api";
import type { ArticlePage, Facets } from "./types";

const emptyFacets: Facets = {
  products: [],
  categories: [],
  sections: [],
  tags: [],
};
export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get("q") ?? "");
  const [data, setData] = useState<ArticlePage | null>(null);
  const [facets, setFacets] = useState<Facets>(emptyFacets);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const search = params.toString();
  const query = params.get("q") ?? "";
  useEffect(() => {
    setTerm(query);
  }, [query]);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      request<ArticlePage>(`/articles?${search}`, { signal: abort.signal }),
      request<Facets>("/facets", { signal: abort.signal }),
    ])
      .then(([page, options]) => {
        if (abort.signal.aborted) return;
        setData(page);
        setFacets(options);
      })
      .catch((e) => {
        if (!abort.signal.aborted) {
          setError(e.message);
          setData(null);
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [search, retry]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  const page = Number(params.get("page") ?? 1);
  const activeFilters = ["product", "category", "section", "tag"].filter(
    (key) => params.has(key),
  );
  return (
    <>
      <section className="kb-hero">
        <div className="kb-container">
          <div className="kb-eyebrow">
            <span className="kb-live-dot" /> BASE DE CONHECIMENTO
          </div>
          <h1>
            Menos procura.
            <br />
            <span>Mais solução.</span>
          </h1>
          <p>
            Encontre procedimentos, entenda os erros e avance no atendimento.
          </p>
          <form
            className="kb-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              filter("q", term.trim());
            }}
          >
            <span className="kb-search-symbol" aria-hidden="true">
              ⌕
            </span>
            <label className="kb-sr" htmlFor="buscar">
              Buscar na base
            </label>
            <input
              id="buscar"
              ref={searchRef}
              maxLength={200}
              placeholder="Busque pelo erro, rotina ou palavra-chave…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <kbd>Ctrl K</kbd>
            <button type="submit" className="kb-primary">
              Buscar
            </button>
          </form>
          <div className="kb-quick">
            <span>Comece por</span>
            {["SNGPC", "XML", "quarentena"].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setTerm(tag);
                  setParams({ q: tag });
                }}
              >
                {tag} ↗
              </button>
            ))}
          </div>
        </div>
        <div className="kb-hero-pattern" aria-hidden="true" />
      </section>
      <div className="kb-container kb-catalog">
        <aside className="kb-filters" aria-label="Filtros de artigos">
          <Link className="kb-primary kb-new-article" to="/artigos/novo">
            + Novo artigo
          </Link>
          <div className="kb-filter-title">
            <h2>Explorar a base</h2>
            {(activeFilters.length > 0 || params.has("q")) && (
              <button className="kb-text-button" onClick={() => setParams({})}>
                Limpar
              </button>
            )}
          </div>
          {(
            [
              ["product", "Produto", facets.products],
              ["category", "Categoria", facets.categories],
              ["section", "Seção", facets.sections],
              ["tag", "Palavra-chave", facets.tags],
            ] as const
          ).map(([key, label, options]) => (
            <label key={key} className="kb-field">
              <span>{label}</span>
              <select
                value={params.get(key) ?? ""}
                onChange={(e) => filter(key, e.target.value)}
              >
                <option value="">Todos</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} ({option.count})
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="kb-sidebar-note">
            <span aria-hidden="true">↗</span>
            <h3>Precisa de mais contexto?</h3>
            <p>
              Consulte o tutorial completo na fonte indicada em cada artigo.
            </p>
            <p>
              Todos da equipe podem cadastrar e editar. A exclusão é restrita ao
              suporte.
            </p>
          </div>
        </aside>
        <section className="kb-results" aria-busy={loading}>
          <div className="kb-results-heading">
            <div>
              <div className="kb-eyebrow">BIBLIOTECA DO SUPORTE</div>
              <h2>
                {params.get("q")
                  ? `Resultados para “${params.get("q")}”`
                  : "Artigos para o dia a dia"}
              </h2>
              <p aria-live="polite">
                {loading
                  ? "Buscando artigos…"
                  : `${data?.total ?? 0} ${(data?.total ?? 0) === 1 ? "artigo encontrado" : "artigos encontrados"}`}
              </p>
            </div>
            <label className="kb-sort">
              <span className="kb-sr">Ordenar artigos</span>
              <select
                value={params.get("sort") ?? "relevance"}
                onChange={(e) => filter("sort", e.target.value)}
              >
                <option value="relevance">Relevância</option>
                <option value="recent">Atualizados recentemente</option>
              </select>
            </label>
          </div>
          {activeFilters.length > 0 && (
            <div className="kb-active-filters">
              {activeFilters.map((key) => (
                <button
                  key={key}
                  onClick={() => filter(key, "")}
                  aria-label={`Remover filtro ${params.get(key)}`}
                >
                  {params.get(key)} ×
                </button>
              ))}
            </div>
          )}
          {error && (
            <div role="alert" className="kb-state kb-error">
              <h3>Não foi possível carregar a base</h3>
              <p>{error}</p>
              <button
                className="kb-secondary"
                onClick={() => setRetry((value) => value + 1)}
              >
                Tentar novamente
              </button>
            </div>
          )}
          {loading ? (
            <div className="kb-article-grid">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="kb-card kb-skeleton" />
              ))}
            </div>
          ) : !error && data?.items.length === 0 ? (
            <div className="kb-state">
              <span className="kb-state-icon" aria-hidden="true">
                ⌕
              </span>
              <h3>
                {data.total > 0
                  ? "Nenhum artigo nesta página"
                  : "Nenhum artigo por aqui"}
              </h3>
              <p>Tente uma parte da mensagem ou remova um dos filtros.</p>
              <button className="kb-secondary" onClick={() => setParams({})}>
                Ver todos os artigos
              </button>
            </div>
          ) : (
            !error && (
              <div className="kb-article-grid">
                {data?.items.map((article) => (
                  <Link
                    className="kb-card"
                    key={article.id}
                    to={`/artigos/${article.slug}`}
                  >
                    <div className="kb-card-top">
                      <span className="kb-category">{article.category}</span>
                      <span className="kb-card-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </div>
                    {article.requiresDatabaseChange && (
                      <span className="kb-db-badge">
                        Alteração no banco · N2
                      </span>
                    )}
                    <h3>{article.title}</h3>
                    <p>{article.summary}</p>
                    <div className="kb-card-tags">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <div className="kb-card-meta">
                      <span>
                        {article.product} <span className="kb-dot">/</span>{" "}
                        {article.section}
                      </span>
                      <time dateTime={article.updatedAt}>
                        {formatDate(article.updatedAt)}
                      </time>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
          {!loading && data && data.total > data.limit && (
            <nav className="kb-pagination" aria-label="Paginação">
              <button
                disabled={page <= 1}
                className="kb-secondary"
                onClick={() =>
                  setParams(
                    queryString({
                      ...Object.fromEntries(params),
                      page: String(page - 1),
                    }),
                  )
                }
              >
                ← Anterior
              </button>
              <span>
                Página {page} de {Math.ceil(data.total / data.limit)}
              </span>
              <button
                disabled={page * data.limit >= data.total}
                className="kb-secondary"
                onClick={() =>
                  setParams(
                    queryString({
                      ...Object.fromEntries(params),
                      page: String(page + 1),
                    }),
                  )
                }
              >
                Próxima →
              </button>
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
