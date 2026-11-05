import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  ApiError,
  errorMessage,
  formatDate,
  queryString,
  request,
} from "./api";
import { useSupport } from "./session-context";
import type { Article, ArticlePage } from "./types";

function TrashDialog({
  article,
  close,
  done,
}: {
  article: Article;
  close: () => void;
  done: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  async function remove() {
    setPending(true);
    setError("");
    try {
      await request(`/support/articles/${article.id}`, {
        method: "DELETE",
        body: JSON.stringify({ version: article.version }),
      });
      done();
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="kb-dialog"
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) close();
      }}
      aria-labelledby="trash-title"
    >
      <h2 id="trash-title">Mover para a lixeira?</h2>
      <p>
        “{article.title}” deixará de aparecer na busca e na leitura pública.
        Você poderá restaurá-lo como rascunho.
      </p>
      {error && (
        <p role="alert" className="kb-error-text">
          {error}
        </p>
      )}
      <div className="kb-actions">
        <button
          autoFocus
          className="kb-secondary"
          disabled={pending}
          onClick={close}
        >
          Cancelar
        </button>
        <button className="kb-danger" disabled={pending} onClick={remove}>
          {pending ? "Movendo…" : "Mover para a lixeira"}
        </button>
      </div>
    </dialog>
  );
}
export default function SupportPage() {
  const { user, ready, loginEnabled, refresh, logout } = useSupport();
  const sessionUsername = user?.username;
  const [username, setUsername] = useState("suporte");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [view, setView] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ArticlePage<Article> | null>(null);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [trash, setTrash] = useState<Article | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!sessionUsername) {
      setData(null);
      return;
    }
    const abort = new AbortController();
    setLoading(true);
    setError("");
    request<ArticlePage<Article>>(
      `/support/articles?${queryString({ page: String(page), sort: "recent", status: ["draft", "published"].includes(view) ? view : "", deleted: view === "trash" ? "true" : "false" })}`,
      { signal: abort.signal },
    )
      .then(setData)
      .catch((e) => {
        if (!abort.signal.aborted) {
          setError(e.message);
          if (e instanceof ApiError && e.status === 401) void refresh();
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [sessionUsername, view, page, revision, refresh]);
  async function login(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await request("/session", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPassword("");
      setPending(false);
    }
  }
  async function restore(article: Article) {
    setPending(true);
    setError("");
    try {
      await request(`/support/articles/${article.id}/restore`, {
        method: "POST",
        body: JSON.stringify({ version: article.version }),
      });
      setNotice("Artigo restaurado como rascunho.");
      setPage(1);
      setRevision((value) => value + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }
  if (!ready)
    return (
      <div className="kb-container kb-state" role="status">
        Verificando acesso…
      </div>
    );
  if (!user)
    return (
      <div className="kb-login-wrap">
        <section className="kb-login">
          <div className="kb-eyebrow">GESTÃO DE CONTEÚDO</div>
          <h1>Área do suporte</h1>
          <p>Entre para criar, revisar e publicar artigos.</p>
          <form onSubmit={login}>
            <label className="kb-field">
              <span>Usuário</span>
              <input
                autoComplete="username"
                maxLength={80}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label className="kb-field">
              <span>Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                maxLength={1024}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {!loginEnabled && (
              <p className="kb-caution">
                O acesso do suporte ainda não está disponível. Solicite sua
                configuração ao responsável pela base.
              </p>
            )}
            {error && (
              <p role="alert" className="kb-error-text">
                {error}
              </p>
            )}
            <button className="kb-primary" disabled={pending || !loginEnabled}>
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </form>
          <Link to="/">← Continuar consultando os artigos</Link>
        </section>
      </div>
    );
  return (
    <div className="kb-container kb-manager">
      <div className="kb-page-heading">
        <div>
          <div className="kb-eyebrow">ÁREA DO SUPORTE</div>
          <h1>Gestão de artigos</h1>
          <p>Revise o conteúdo antes de torná-lo público.</p>
        </div>
        <div className="kb-actions">
          <button
            className="kb-secondary"
            onClick={async () => {
              try {
                await logout();
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          >
            Sair
          </button>
          <Link className="kb-primary" to="/admin/novo">
            + Novo artigo
          </Link>
        </div>
      </div>
      <div className="kb-tabs" role="group" aria-label="Situação dos artigos">
        {[
          ["all", "Todos"],
          ["published", "Publicados"],
          ["draft", "Rascunhos"],
          ["trash", "Lixeira"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={view === value}
            onClick={() => {
              setView(value);
              setPage(1);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {notice && (
        <p role="status" className="kb-notice">
          {notice}
        </p>
      )}
      {error && (
        <div role="alert" className="kb-error">
          <p>{error}</p>
          <button
            className="kb-secondary"
            onClick={() => setRevision((value) => value + 1)}
          >
            Recarregar
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">Carregando artigos…</p>
      ) : (
        <>
          <p className="kb-manager-count">{data?.total ?? 0} artigos</p>
          <div className="kb-management-list">
            {data?.items.map((article) => (
              <div key={article.id} className="kb-management-row">
                <div>
                  <span className={`kb-status ${article.status}`}>
                    {article.deletedAt
                      ? "Na lixeira"
                      : article.status === "published"
                        ? "Publicado"
                        : "Rascunho"}
                  </span>
                  <h2>{article.title}</h2>
                  <p>
                    {article.product} / {article.category} / {article.section} ·{" "}
                    {formatDate(article.updatedAt)}
                  </p>
                </div>
                <div className="kb-actions">
                  {article.deletedAt ? (
                    <button
                      className="kb-secondary"
                      disabled={pending}
                      onClick={() => restore(article)}
                    >
                      Restaurar rascunho
                    </button>
                  ) : (
                    <>
                      <Link
                        className="kb-secondary"
                        to={`/admin/artigos/${article.id}`}
                      >
                        Editar
                      </Link>
                      {article.status === "published" && (
                        <Link
                          className="kb-text-button"
                          to={`/artigos/${article.slug}`}
                        >
                          Abrir ↗
                        </Link>
                      )}
                      <button
                        className="kb-text-button kb-error-text"
                        onClick={() => setTrash(article)}
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {data?.items.length === 0 && (
            <div className="kb-state">
              <h2>Nenhum artigo nesta lista</h2>
              <p>
                {view === "trash"
                  ? "Os artigos excluídos poderão ser restaurados aqui."
                  : "Crie um artigo ou escolha outra situação."}
              </p>
            </div>
          )}
          {data && data.total > data.limit && (
            <nav className="kb-pagination" aria-label="Paginação da gestão">
              <button
                className="kb-secondary"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                ← Anterior
              </button>
              <span>Página {page}</span>
              <button
                className="kb-secondary"
                disabled={page * data.limit >= data.total}
                onClick={() => setPage((value) => value + 1)}
              >
                Próxima →
              </button>
            </nav>
          )}
        </>
      )}
      {trash && (
        <TrashDialog
          article={trash}
          close={() => setTrash(null)}
          done={() => {
            setTrash(null);
            setNotice("Artigo movido para a lixeira.");
            setPage(1);
            setRevision((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}
