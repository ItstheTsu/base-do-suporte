import { useState } from "react";
import { procedureKind } from "./article-sections";
import { copyLink as copyText } from "./clipboard";
import type { ArticleDocument, ArticleImage } from "./types";

function SqlBlock({ code }: { code: string }) {
  const [copyResult, setCopyResult] = useState<"copied" | "manual" | null>(null);

  async function copySql() {
    setCopyResult(await copyText(code) ? "copied" : "manual");
  }

  return (
    <div className="kb-sql-block">
      <div className="kb-sql-toolbar">
        <strong>SQL</strong>
        <button type="button" className="kb-secondary" onClick={copySql}>Copiar SQL</button>
      </div>
      <pre tabIndex={0} aria-label="Código SQL"><code>{code}</code></pre>
      {copyResult && <p role="status" className="kb-sql-status">
        {copyResult === "copied" ? "SQL copiado." : "Copie o código selecionado abaixo."}
      </p>}
      {copyResult === "manual" && <label className="kb-field kb-sql-manual">
        <span>Código para copiar</span>
        <textarea readOnly value={code} rows={5} autoFocus onFocus={event => event.currentTarget.select()} />
      </label>}
    </div>
  );
}

export default function ArticleContent({article,imageSources={}}:{article:ArticleDocument;imageSources?:Record<string,string>}){
 const mode=article.databaseMode && article.databaseMode!=="none"?article.databaseMode:article.requiresDatabaseChange?"write":"none";
 const procedure = article.procedureSections ?? [];
 const figure=(image:ArticleImage)=><figure key={image.id} className="kb-procedure-image"><a href={imageSources[image.id]||image.url} target="_blank" rel="noreferrer"><img src={imageSources[image.id]||image.url} alt={image.caption||"Print do procedimento"} loading="lazy" decoding="async"/></a>{image.caption&&<figcaption>{image.caption}</figcaption>}</figure>;
 return <div className="kb-article-body">
  {mode!=="none"&&<div className={mode==="write"?"kb-caution":"kb-validation"}><strong>{mode==="write"?"Alteração direta no banco de dados":"Consulta ao banco de dados"}</strong>{mode==="write"&&<p>Confirme a autorização, o ambiente e a recuperação antes de qualquer execução.</p>}</div>}
  {article.requiresEscalation&&<div className="kb-caution"><strong>Escalonamento necessário · N2 / Supervisor</strong><p>Execute as etapas indicadas somente com auxílio ou autorização do responsável.</p></div>}
  {article.errorMessage&&<section id="mensagem"><h2>Mensagem apresentada</h2><pre className="kb-error-message">{article.errorMessage}</pre></section>}
  <section id="sintomas"><h2>Quando acontece</h2><p>{article.symptoms}</p></section>
  <section id="causa"><h2>O que verificar</h2><p>{article.cause}</p></section>
  <section id="procedimento">
   <h2>Como proceder</h2>
   {procedure.length ? procedure.map(section => {
    const kind = procedureKind(section);
    const steps = kind === "steps" ? section.steps.filter(step => step.trim()) : [];
    return <section key={section.id} id={`secao-${section.id}`}>
     {(procedure.length > 1 || section.title.toLowerCase() !== "procedimento") && <h3>{section.title}</h3>}
     {kind === "sql" && section.sql?.trim() && <SqlBlock code={section.sql} />}
     {steps.length > 0 && <ol>{steps.map((step, index) => (
      <li key={index}><div><p>{step}</p>{section.images.filter(image => image.step === index + 1).map(figure)}</div></li>
     ))}</ol>}
     {section.images.filter(image => kind !== "steps" || !image.step).map(figure)}
    </section>;
   }) : <ol>{article.steps.map((step, index) => <li key={index}><span>{step}</span></li>)}</ol>}
  </section>
  <section id="validacao" className="kb-validation"><h2>Como validar</h2><p>{article.validation}</p></section>
  {article.warnings.length>0&&<section id="cuidados" className="kb-caution"><h2>Cuidados</h2><ul>{article.warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul></section>}
  {article.sources.length>0&&<section id="fontes"><h2>Fontes e referências</h2><p>Esta síntese organiza o atendimento. Consulte o documento de origem para o contexto completo e a versão aplicável.</p><ul className="kb-sources">{article.sources.map((source,index)=><li key={index}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul></section>}
 </div>;
}
