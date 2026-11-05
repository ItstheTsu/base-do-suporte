import type { ArticleDocument } from "./types";

export default function ArticleContent({
  article,
}: {
  article: ArticleDocument;
}) {
  return (
    <div className="kb-article-body">
      {article.requiresDatabaseChange && (
        <div className="kb-caution">
          <strong>Alteração direta no banco · N2 / Supervisor</strong>
          <p>
            Este procedimento envolve dados do sistema. Confirme a autorização,
            o ambiente e a recuperação antes de qualquer execução.
          </p>
        </div>
      )}
      <section id="sintomas">
        <h2>Quando acontece</h2>
        <p>{article.symptoms}</p>
      </section>
      <section id="causa">
        <h2>O que verificar</h2>
        <p>{article.cause}</p>
      </section>
      <section id="procedimento">
        <h2>Como proceder</h2>
        <ol>
          {article.steps.map((step, index) => (
            <li key={index}>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
      <section id="validacao" className="kb-validation">
        <h2>Como validar</h2>
        <p>{article.validation}</p>
      </section>
      {article.warnings.length > 0 && (
        <section id="cuidados" className="kb-caution">
          <h2>Cuidados</h2>
          <ul>
            {article.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </section>
      )}
      <section id="fontes">
        <h2>Fontes e referências</h2>
        <p>
          Esta síntese organiza o atendimento. Consulte o documento de origem
          para o contexto completo e a versão aplicável.
        </p>
        <ul className="kb-sources">
          {article.sources.map((source, index) => (
            <li key={index}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
