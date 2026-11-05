import type { ArticleDocument, ArticleImage } from "./types";
export default function ArticleContent({article,imageSources={}}:{article:ArticleDocument;imageSources?:Record<string,string>}){
 const mode=article.databaseMode && article.databaseMode!=="none"?article.databaseMode:article.requiresDatabaseChange?"write":"none";
 const figure=(image:ArticleImage)=><figure key={image.id} className="kb-procedure-image"><a href={imageSources[image.id]||image.url} target="_blank" rel="noreferrer"><img src={imageSources[image.id]||image.url} alt={image.caption||"Print do procedimento"} loading="lazy" decoding="async"/></a>{image.caption&&<figcaption>{image.caption}</figcaption>}</figure>;
 return <div className="kb-article-body">
  {mode!=="none"&&<div className={mode==="write"?"kb-caution":"kb-validation"}><strong>{mode==="write"?"Alteração direta no banco de dados":"Consulta ao banco de dados"}</strong>{mode==="write"&&<p>Confirme a autorização, o ambiente e a recuperação antes de qualquer execução.</p>}</div>}
  {article.requiresEscalation&&<div className="kb-caution"><strong>Escalonamento necessário · N2 / Supervisor</strong><p>Execute as etapas indicadas somente com auxílio ou autorização do responsável.</p></div>}
  {article.errorMessage&&<section id="mensagem"><h2>Mensagem apresentada</h2><pre className="kb-error-message">{article.errorMessage}</pre></section>}
  <section id="sintomas"><h2>Quando acontece</h2><p>{article.symptoms}</p></section>
  <section id="causa"><h2>O que verificar</h2><p>{article.cause}</p></section>
  <section id="procedimento"><h2>Como proceder</h2>{article.procedureSections?.length?article.procedureSections.map(section=><section key={section.id} id={"secao-"+section.id}>{(article.procedureSections!.length>1 || section.title.toLowerCase()!=="procedimento")&&<h3>{section.title}</h3>}<ol>{section.steps.filter(step=>step.trim()).map((step,index)=><li key={index}><div><p>{step}</p>{section.images.filter(image=>image.step===index+1).map(figure)}</div></li>)}</ol>{section.images.filter(image=>!image.step).map(figure)}</section>):<ol>{article.steps.map((step,index)=><li key={index}><span>{step}</span></li>)}</ol>}</section>
  <section id="validacao" className="kb-validation"><h2>Como validar</h2><p>{article.validation}</p></section>
  {article.warnings.length>0&&<section id="cuidados" className="kb-caution"><h2>Cuidados</h2><ul>{article.warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul></section>}
  {article.sources.length>0&&<section id="fontes"><h2>Fontes e referências</h2><p>Esta síntese organiza o atendimento. Consulte o documento de origem para o contexto completo e a versão aplicável.</p><ul className="kb-sources">{article.sources.map((source,index)=><li key={index}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul></section>}
 </div>;
}
