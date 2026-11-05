import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { ApiError, errorMessage, request } from "./api";
import { useSupport } from "./session-context";
import ArticleContent from "./ArticleContent";
import ProcedureEditor from "./ProcedureEditor";
import Icon from "./Icon";
import type { Article, ArticleDocument } from "./types";

const blank: ArticleDocument = {
  title: "",
  slug: "",
  summary: "",
  product: "OuroFarma",
  category: "SNGPC",
  section: "Erros",
  tags: [],
  symptoms: "",
  cause: "",
  steps: [""],
  validation: "",
  warnings: [],
  sources: [{ title: "", url: "" }],
  status: "draft",
  databaseMode: "none",
  requiresEscalation: false,
  errorMessage: "",
  procedureSections: [{ id: "principal", title: "Procedimento", steps: [""], images: [] }],
};
const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export default function ArticleEditor() {
  const { id, slug } = useParams();
  const adminMode = useLocation().pathname.startsWith("/admin");
  const editing = Boolean(id || slug);
  const navigate = useNavigate();
  const { user, ready } = useSupport();
  const authenticated = Boolean(user);
  const [document, setDocument] = useState<ArticleDocument>(blank);
  const [version, setVersion] = useState<number | null>(null);
  const [articleId, setArticleId] = useState<string | null>(id ?? null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading,setUploading] = useState(false);
  const [imageSources,setImageSources] = useState<Record<string,string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);
  const [preview, setPreview] = useState(false);
  const [reload, setReload] = useState(0);
  const [tags, setTags] = useState("");
  useEffect(() => {
    if (!editing) {
      setDocument({ ...blank, status: adminMode ? "draft" : "published" });
      setTags("");
      setVersion(null);
      setArticleId(null);
      setLoading(false);
      return;
    }
    if (adminMode && !authenticated) return;
    const abort = new AbortController();
    setLoading(true);
    setError("");
    setConflict(false);
    request<Article>(
      adminMode
        ? `/support/articles/${id}`
        : `/articles/${encodeURIComponent(slug ?? "")}`,
      { signal: abort.signal },
    )
      .then((article) => {
        if (article.deletedAt)
          throw new Error(
            "Este artigo está na lixeira. Restaure-o antes de editar.",
          );
        const {
          id: _id,
          version: revision,
          createdAt: _created,
          updatedAt: _updated,
          publishedAt: _published,
          deletedAt: _deleted,
          ...content
        } = article;
        setDocument({...content,procedureSections:content.procedureSections?.length?content.procedureSections:[{id:"principal",title:"Procedimento",steps:content.steps,images:[]}],databaseMode:content.databaseMode || (content.requiresDatabaseChange?"write":"none"),requiresEscalation:content.requiresEscalation ?? Boolean(content.requiresDatabaseChange)});
        setArticleId(article.id);
        setVersion(revision);
        setTags(content.tags.join(", "));
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [id, slug, editing, adminMode, authenticated, reload]);
  function field<K extends keyof ArticleDocument>(
    key: K,
    value: ArticleDocument[K],
  ) {
    setDocument((old) => ({ ...old, [key]: value }));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    setConflict(false);
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const content: ArticleDocument = {
      ...document,
      requiresDatabaseChange:document.databaseMode==="write" || (!document.databaseMode && Boolean(document.requiresDatabaseChange)),
      procedureSections:(document.procedureSections||[]).map(section=>({...section,steps:section.steps.map(step=>step.trim()).filter(Boolean)})),
      status:
        !adminMode || submitter?.value === "published" ? "published" : "draft",
      tags: [
        ...new Set(
          tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
      ],
      steps: document.procedureSections?.length
        ? document.procedureSections.flatMap(section=>section.steps.map(step=>step.trim()).filter(Boolean)).concat(document.procedureSections.every(section=>!section.steps.some(step=>step.trim()))?["Consulte as imagens do procedimento."]:[])
        : document.steps.map((step) => step.trim()).filter(Boolean),
      warnings: document.warnings
        .map((warning) => warning.trim())
        .filter(Boolean),
    };
    try {
      const article = await request<Article>(
        adminMode
          ? editing
            ? `/support/articles/${id}`
            : "/support/articles"
          : editing
            ? `/articles/${articleId}`
            : "/articles",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(editing ? { ...content, version } : content),
        },
      );
      setDocument(content);
      setVersion(article.version);
      setNotice(
        article.status === "published"
          ? "Artigo publicado. A leitura pública já está disponível."
          : "Rascunho salvo. Apenas o suporte pode consultá-lo.",
      );
      if (!editing)
        navigate(
          adminMode
            ? `/admin/artigos/${article.id}`
            : `/artigos/${article.slug}/editar`,
          { replace: true },
        );
    } catch (e) {
      setConflict(e instanceof ApiError && e.status === 409);
      setError(
        e instanceof ApiError && e.fields.length
          ? e.fields.map((item) => `${item.field}: ${item.message}`).join(" · ")
          : errorMessage(e),
      );
    } finally {
      setSaving(false);
    }
  }
  if (adminMode && !ready)
    return (
      <div className="kb-container kb-state" role="status">
        Verificando acesso…
      </div>
    );
  if (adminMode && !user) return <Navigate to="/admin" replace />;
  if (loading)
    return (
      <div className="kb-container kb-state" role="status">
        Carregando artigo…
      </div>
    );
  if (editing && version === null)
    return (
      <div className="kb-container kb-state" role="alert">
        <h1>Não foi possível abrir o editor</h1>
        <p>{error}</p>
        <Link to={adminMode ? "/admin" : "/"}>Voltar para a base</Link>
      </div>
    );
  return (
    <div className="kb-container kb-editor">
      <Link className="kb-back" to={adminMode ? "/admin" : "/"}>
        <Icon name="back" size={16} /> {adminMode ? "Gestão de artigos" : "Base do Suporte"}
      </Link>
      <div className="kb-page-heading">
        <div>
          <div className="kb-eyebrow">CONTEÚDO DO SUPORTE</div>
          <h1>{editing ? "Editar artigo" : "Novo artigo"}</h1>
          <p>
            Preencha o contexto, os passos e a forma de conferir o resultado.
          </p>
        </div>
        <span className={`kb-status ${editing ? document.status : "unpublished"}`}>
          {!editing ? "Não publicado" : document.status === "published" ? "Publicado" : "Rascunho"}
        </span>
      </div>
      <form onSubmit={save} onInvalidCapture={event => { const target = event.target as HTMLInputElement; const details = target.closest("details"); if (details) details.open = true; }}>
        <fieldset disabled={saving || uploading}>
          <legend className="kb-sr">Conteúdo do artigo</legend>
          <section className="kb-editor-section">
            <h2>1. Informações do artigo</h2>
            <label className="kb-field">
              <span>Título</span>
              <input
                required
                minLength={5}
                maxLength={180}
                value={document.title}
                onChange={(e) => {
                  field("title", e.target.value);
                  if (!editing) field("slug", slugify(e.target.value));
                }}
              />
            </label>
            <details className="kb-disclosure"><summary>Personalizar endereço do artigo</summary>
            <label className="kb-field">
              <span>Endereço do artigo</span>
              <input
                required
                minLength={3}
                maxLength={180}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={document.slug}
                readOnly={editing}
                onChange={(e) => field("slug", e.target.value)}
              />
              <small>
                /artigos/{document.slug || "titulo-do-artigo"}
                {editing ? " · Endereço permanente." : ""}
              </small>
            </label>
            </details>
            <label className="kb-field">
              <span>Resumo</span>
              <textarea
                required
                minLength={15}
                maxLength={500}
                rows={3}
                value={document.summary}
                onChange={(e) => field("summary", e.target.value)}
              />
            </label>
            <div className="kb-field-grid">
              {(
                [
                  ["product", "Produto"],
                  ["category", "Categoria"],
                  ["section", "Seção"],
                ] as const
              ).map(([key, label]) => (
                <label className="kb-field" key={key}>
                  <span>{label}</span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    value={document[key]}
                    onChange={(e) => field(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <label className="kb-field">
              <span>Palavras-chave</span>
              <input
                maxLength={500}
                placeholder="SNGPC, XML, lote"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <small>
                Separe por vírgulas. Até 12 palavras-chave com 40 caracteres
                cada.
              </small>
            </label>
          </section>
          <section className="kb-editor-section">
            <h2>2. Contexto</h2>
            <label className="kb-field"><span>Mensagem de erro</span><textarea rows={3} maxLength={5000} value={document.errorMessage||""} onChange={e=>field("errorMessage",e.target.value)}/></label>
            {(
              [
                ["symptoms", "Quando acontece"],
                ["cause", "O que verificar"],
              ] as const
            ).map(([key, label]) => (
              <label className="kb-field" key={key}>
                <span>{label}</span>
                <textarea
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={3}
                  value={document[key]}
                  onChange={(e) => field(key, e.target.value)}
                />
              </label>
            ))}
          </section>
          <ProcedureEditor value={document.procedureSections||[]} steps={document.steps} onBusy={setUploading} onPreview={(id,url)=>setImageSources(old=>({...old,[id]:url}))} onChange={value=>field("procedureSections",value)}/>
          <section className="kb-editor-section">
            <h2>4. Validação e cuidados</h2>
            <label className="kb-field">
              <span>Como validar</span>
              <textarea
                required
                minLength={10}
                maxLength={5000}
                rows={3}
                value={document.validation}
                onChange={(e) => field("validation", e.target.value)}
              />
            </label>
            <details className="kb-disclosure" open={Boolean(document.requiresEscalation || document.warnings.length || (document.databaseMode && document.databaseMode !== "none")) || undefined}>
              <summary>Cuidados, escalonamento e acesso ao banco</summary>
            <label className="kb-field"><span>Atuação no banco de dados</span><select value={document.databaseMode || (document.requiresDatabaseChange?"write":"none")} onChange={e=>{const mode=e.target.value as "none"|"read"|"write";field("databaseMode",mode);field("requiresDatabaseChange",mode==="write");if(mode==="write")field("requiresEscalation",true);}}><option value="none">Sem atuação direta no banco</option><option value="read">Consulta ao banco</option><option value="write">Alteração direta no banco</option></select></label>
            <label className="kb-database-check"><input type="checkbox" checked={document.requiresEscalation??Boolean(document.requiresDatabaseChange)} onChange={e=>field("requiresEscalation",e.target.checked)}/><span>Exige auxílio/escalonamento para N2 ou Supervisor.</span></label>
            <label className="kb-field">
              <span>Cuidados e limites de aplicação</span>
              <textarea
                maxLength={15000}
                rows={3}
                value={document.warnings.join("\n")}
                onChange={(e) => field("warnings", e.target.value.split("\n"))}
              />
              <small>
                Um cuidado por linha. Não inclua dados de clientes ou
                credenciais.
              </small>
            </label>
            </details>
          </section>
          <section className="kb-editor-section">
            <h2>5. Referências</h2>
            <p>
              Use endereços públicos, sem senha ou token. Ao menos uma fonte é
              obrigatória.
            </p>
            {document.sources.map((source, index) => (
              <div className="kb-source-row" key={index}>
                <label className="kb-field">
                  <span>Nome da fonte {index + 1}</span>
                  <input
                    required
                    minLength={3}
                    maxLength={180}
                    value={source.title}
                    onChange={(e) =>
                      field(
                        "sources",
                        document.sources.map((item, i) =>
                          i === index
                            ? { ...item, title: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className="kb-field">
                  <span>Link da fonte {index + 1}</span>
                  <input
                    required
                    type="url"
                    maxLength={1000}
                    placeholder="https://"
                    value={source.url}
                    onChange={(e) =>
                      field(
                        "sources",
                        document.sources.map((item, i) =>
                          i === index ? { ...item, url: e.target.value } : item,
                        ),
                      )
                    }
                  />
                </label>
                {document.sources.length > 1 && (
                  <button
                    type="button"
                    className="kb-text-button"
                    onClick={() =>
                      field(
                        "sources",
                        document.sources.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remover fonte {index + 1}
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              disabled={document.sources.length >= 10}
              className="kb-secondary"
              onClick={() =>
                field("sources", [...document.sources, { title: "", url: "" }])
              }
            >
              + Adicionar fonte
            </button>
          </section>
        </fieldset>
        {error && (
          <div role="alert" className="kb-error">
            <p>{error}</p>
            {conflict && (
              <button
                className="kb-secondary"
                type="button"
                onClick={() => setReload((value) => value + 1)}
              >
                Recarregar versão salva (descarta alterações)
              </button>
            )}
          </div>
        )}
        {notice && (
          <p className="kb-notice" role="status">
            {notice}{document.status === "published" && <Link to={`/artigos/${document.slug}`}>Ver artigo</Link>}
          </p>
        )}
        <div className="kb-editor-actions">
          <button
            type="button"
            className="kb-secondary"
            onClick={() => setPreview((value) => !value)}
          >
            {preview ? "Fechar prévia" : "Visualizar prévia"}
          </button>
          <div className="kb-actions">
            {adminMode && (
              <button
                className="kb-secondary"
                disabled={saving || uploading}
                name="action"
                value="draft"
              >
                Salvar rascunho
              </button>
            )}
            <button
              className="kb-primary"
              disabled={saving || uploading}
              name="action"
              value="published"
            >
              {saving
                ? "Salvando…"
                : editing && document.status === "published"
                  ? "Salvar publicação"
                  : "Publicar artigo"}
            </button>
          </div>
        </div>
        {adminMode && document.status === "published" && (
          <p className="kb-editor-hint">
            Salvar como rascunho retira o artigo da leitura pública.
          </p>
        )}
      </form>

      {preview && (
        <section className="kb-preview">
          <div className="kb-eyebrow">PRÉVIA DO ARTIGO</div>
          <h1>{document.title || "Título do artigo"}</h1>
          <p>{document.summary}</p>
          <ArticleContent article={document} imageSources={imageSources} />
        </section>
      )}
    </div>
  );
}
