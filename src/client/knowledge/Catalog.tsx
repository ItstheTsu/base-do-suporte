import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { formatDate, request } from "./api";
import Icon from "./Icon";
import type { ArticlePage, Facets } from "./types";

const emptyFacets: Facets = { products: [], categories: [], sections: [], tags: [] };
export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get("q") ?? "");
  const [data, setData] = useState<ArticlePage | null>(null);
  const [facets, setFacets] = useState<Facets>(emptyFacets);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const search = params.toString();
  const query = params.get("q") ?? "";
  useEffect(() => { setTerm(query); }, [query]);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setError("");
    request<ArticlePage>(`/articles?${search}`, { signal: abort.signal })
      .then(page => { if (!abort.signal.aborted) setData(page); })
      .catch(e => { if (!abort.signal.aborted) { setError(e.message); setData(null); } })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [search, retry]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    request<Facets>("/facets", { signal: abort.signal })
      .then(value => { if (!abort.signal.aborted) setFacets(value); }).catch(() => {});
    return () => abort.abort();
  }, [retry]);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params); next.delete("page");
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  }
  const page = data?.page ?? 1;
  const activeFilters = ["product", "category", "section", "tag"].filter(key => params.has(key));
  return <div className="kb-container kb-library">
    <div className="kb-page-heading kb-library-heading">
      <div><h1>Base de conhecimento</h1><p>Procedimentos e soluções para o atendimento.</p></div>
      <Link className="kb-primary" to="/artigos/novo"><Icon name="plus" size={18} /> Novo artigo</Link>
    </div>
    <form className="kb-search" role="search" onSubmit={event => { event.preventDefault(); filter("q", term.trim()); }}>
      <Icon name="search" size={22} /><label className="kb-sr" htmlFor="buscar">Buscar na base</label>
      <input id="buscar" ref={searchRef} type="search" maxLength={200} placeholder="Digite o erro, a rotina ou uma palavra-chave" value={term} onChange={e => setTerm(e.target.value)} />
      <kbd>Ctrl K</kbd><button type="submit" className="kb-primary">Buscar</button>
    </form>
    <div className="kb-catalog">
      <button className="kb-secondary kb-filter-toggle" aria-expanded={filtersOpen} aria-controls="filtros-artigos" onClick={() => setFiltersOpen(value => !value)}><Icon name="filter" size={18} /> Filtros{activeFilters.length ? ` (${activeFilters.length})` : ""}</button>
      <aside id="filtros-artigos" className={`kb-filters ${filtersOpen ? "is-open" : ""}`} aria-label="Filtros de artigos">
        <div className="kb-filter-title"><h2>Filtros</h2>{(activeFilters.length > 0 || query) && <button className="kb-text-button" onClick={() => setParams({})}>Limpar</button>}</div>
        {([
          ["category", "Categoria", facets.categories], ["product", "Produto", facets.products],
          ["section", "Seção", facets.sections], ["tag", "Palavra-chave", facets.tags],
        ] as const).map(([key, label, options]) => <label key={key} className="kb-field"><span>{label}</span>
          <select value={params.get(key) ?? ""} onChange={e => filter(key, e.target.value)}><option value="">Todos</option>{options.map(option => <option key={option.value} value={option.value}>{option.value} ({option.count})</option>)}</select>
        </label>)}
        <p className="kb-filter-help">Não encontrou a solução? <Link to="/artigos/novo">Compartilhe um procedimento.</Link></p>
      </aside>
      <section className="kb-results" aria-busy={loading} aria-label="Artigos da base">
        <div className="kb-results-heading"><div><h2>{query ? `Resultados para “${query}”` : "Todos os artigos"}</h2>
          <p aria-live="polite">{loading ? "Buscando artigos…" : error ? "Busca indisponível" : `${data?.total ?? 0} ${(data?.total ?? 0) === 1 ? "artigo encontrado" : "artigos encontrados"}`}</p>
        </div><label className="kb-sort"><span className="kb-sr">Ordenar artigos</span><select value={params.get("sort") ?? "relevance"} onChange={e => filter("sort", e.target.value)}><option value="relevance">Relevância</option><option value="recent">Mais recentes</option></select></label></div>
        {activeFilters.length > 0 && <div className="kb-active-filters">{activeFilters.map(key => <button key={key} onClick={() => filter(key, "")} aria-label={`Remover filtro ${params.get(key)}`}>{params.get(key)} <Icon name="close" size={13} /></button>)}</div>}
        {error ? <div role="alert" className="kb-state kb-error"><h3>Não foi possível carregar a base</h3><p>{error}</p><button className="kb-secondary" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div>
          : loading ? <div className="kb-article-list" aria-hidden="true">{[1, 2, 3].map(n => <div key={n} className="kb-skeleton" />)}</div>
          : data?.items.length === 0 ? <div className="kb-state"><Icon name="search" size={30} /><h3>{data.total > 0 ? "Nenhum artigo nesta página" : "Nenhum artigo encontrado"}</h3><p>Tente outra palavra ou remova os filtros.</p><button className="kb-secondary" onClick={() => setParams({})}>Ver todos os artigos</button></div>
          : <div className="kb-article-list">{data?.items.map(article => <Link className="kb-card" key={article.id} to={`/artigos/${article.slug}`}>
            <span className="kb-card-icon"><Icon name="book" size={21} /></span>
            <div className="kb-card-content"><div className="kb-card-top"><span className="kb-category">{article.category}</span>{(article.requiresDatabaseChange || article.databaseMode === "write" || article.databaseMode === "read") && <span className="kb-db-badge">{article.databaseMode === "read" ? "Consulta ao banco" : "Alteração no banco"}</span>}{article.requiresEscalation && <span className="kb-db-badge">N2 / Supervisor</span>}</div>
              <h3>{article.title}</h3><p>{article.summary}</p><div className="kb-card-meta"><span>{article.product} · {article.section}</span><time dateTime={article.updatedAt}>Atualizado em {formatDate(article.updatedAt)}</time></div>
            </div><span className="kb-card-arrow"><Icon name="arrow" size={19} /></span>
          </Link>)}</div>}
        {data && data.total > data.limit && <nav className="kb-pagination" aria-label="Paginação dos artigos"><button className="kb-secondary" disabled={page <= 1 || loading} onClick={() => { const next = new URLSearchParams(params); next.set("page", String(page - 1)); setParams(next); }}>Anterior</button><span>Página {page} de {Math.ceil(data.total / data.limit)}</span><button className="kb-secondary" disabled={page * data.limit >= data.total || loading} onClick={() => { const next = new URLSearchParams(params); next.set("page", String(page + 1)); setParams(next); }}>Próxima</button></nav>}
      </section>
    </div>
  </div>;
}
