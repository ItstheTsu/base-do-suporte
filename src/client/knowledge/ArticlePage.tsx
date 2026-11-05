import { Fragment, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError, formatDate, queryString, request } from "./api";
import ArticleContent from "./ArticleContent";
import { sections } from "./article-sections";
import { copyLink } from "./clipboard";
import Icon from "./Icon";
import type { Article, ArticleSummary, ArticlePage as Page } from "./types";

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<ArticleSummary[]>([]);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState("");
  const [showCopy, setShowCopy] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    setArticle(null);
    setRelated([]);
    setError("");
    setNotFound(false);
    setCopied("");
    setShowCopy(false);
    request<Article>(`/articles/${encodeURIComponent(slug ?? "")}`, {
      signal: abort.signal,
    })
      .then((value) => {
        setArticle(value);
        document.title = `${value.title} | Base do Suporte`;
        return request<Page>(
          `/articles?${queryString({ category: value.category, product: value.product, limit: "6" })}`,
          { signal: abort.signal },
        );
      })
      .then((page) =>
        setRelated(page.items.filter((item) => item.slug !== slug).slice(0, 3)),
      )
      .catch((e) => {
        if (!abort.signal.aborted) {
          setNotFound(e instanceof ApiError && e.status === 404);
          setError(e.message);
        }
      });
    return () => {
      abort.abort();
      document.title = "Base do Suporte";
    };
  }, [slug]);
  async function share() {
    const success = await copyLink(window.location.href);
    setCopied(success ? "Link copiado." : "Selecione e copie o endereço abaixo.");
    setShowCopy(!success);
  }
  if (!article)
    return (
      <div className="kb-container kb-state" role={error ? "alert" : "status"}>
        {error ? (
          <>
            <h1>
              {notFound
                ? "Artigo não disponível"
                : "Não foi possível abrir o artigo"}
            </h1>
            <p>{error}</p>
            <Link to="/">Voltar para a base</Link>
          </>
        ) : (
          <p>Carregando artigo…</p>
        )}
      </div>
    );
  return (
    <div className="kb-container kb-article-layout">
      <article className="kb-article">
        <nav className="kb-breadcrumb" aria-label="Caminho do artigo">
          <Link to="/">Base do Suporte</Link>
          <span>/</span>
          <Link to={`/?${queryString({ category: article.category })}`}>
            {article.category}
          </Link>
          <span>/</span>
          <span>{article.section}</span>
        </nav>
        <div className="kb-article-heading">
          <span className="kb-category">{article.product}</span>
          <h1>{article.title}</h1>
          <p>{article.summary}</p>
          <div className="kb-article-meta">
            <span>Atualizado em {formatDate(article.updatedAt)}</span>
            <span>Leitura pública</span>
          </div>
          <div className="kb-article-tools">
            <button className="kb-secondary" onClick={share}>
              <Icon name="link" size={16} /> Copiar link
            </button>
            <Link
              className="kb-secondary"
              to={`/artigos/${article.slug}/editar`}
            >
              <Icon name="edit" size={16} /> Editar artigo
            </Link>
            <span role="status">{copied}</span>
          </div>
          {showCopy && <label className="kb-field kb-copy-field"><span>Link deste artigo</span><input readOnly value={window.location.href} onFocus={e=>e.target.select()} autoFocus /></label>}
        </div>
        <ArticleContent article={article} />
        <div className="kb-article-tags">
          {article.tags.map((tag) => (
            <Link key={tag} to={`/?${queryString({ tag })}`}>
              #{tag}
            </Link>
          ))}
        </div>
        {related.length > 0 && (
          <section className="kb-related">
            <h2>Continue a consulta</h2>
            {related.map((item) => (
              <Link key={item.id} to={`/artigos/${item.slug}`}>
                {item.title}
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </section>
        )}
      </article>
      <aside className="kb-toc" aria-label="Nesta página">
        <span className="kb-eyebrow">NESTE ARTIGO</span>
        <nav>
          {article.errorMessage && <a href="#mensagem">Mensagem apresentada</a>}
          {sections
            .filter(([id]) => (id !== "cuidados" || article.warnings.length > 0) && (id !== "fontes" || article.sources.length > 0))
            .map(([id, label]) => (
              <Fragment key={id}><a href={`#${id}`}>
                {label}
              </a>{id === "procedimento" && article.procedureSections?.filter(section=>article.procedureSections!.length>1 || section.title.toLowerCase()!=="procedimento").map(section => <a className="kb-toc-child" href={`#secao-${section.id}`} key={section.id}>{section.title}</a>)}</Fragment>
            ))}
        </nav>
        <Link to="/">← Explorar a base</Link>
      </aside>
    </div>
  );
}
