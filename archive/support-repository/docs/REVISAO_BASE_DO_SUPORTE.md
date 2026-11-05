# Revisão da Base do Suporte — 05/11/2026

## Conclusão

Os repositórios indicados não contêm a implementação da Base do Suporte descrita em outubro. Eles contêm IncidentSQL: desafios de SQL com autenticação geral, incidentes, pontos e ranking. O próximo incremento de maior valor é disponibilizar o fluxo completo **encontrar → consultar → cadastrar/editar conhecimento**, com exclusão administrativa e conteúdo inicial útil.

Esta proposta acrescenta esse fluxo nos dois repositórios e muda suas entradas para a Base do Suporte. O código legado é preservado. Não altera a instalação que já roda no computador do usuário, nem importa seu conteúdo. A adoção deve ser coordenada entre frontend e API; não deve ser aplicada por cima de dados de outra instalação sem identificar seu formato.

## Estado revisado e lacunas

Referências da revisão: frontend `f46fd70fd22c213e5f11322f77abf420811a0180`, commit “feat: query no banco”, em 29/06/2026; API `7a84aae260d3bfb142c2f505da87416366830e0b`, commit inicial em 27/06/2026. Datas confirmadas no GitHub.

| Prioridade | Evidência no estado anterior                                                                                    | Consequência                                                                          | Incremento proposto                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Alta       | `src/main.tsx` exige usuário antes de renderizar a aplicação                                                    | A consulta não atende à regra sem login geral                                         | Rotas públicas e área administrativa separada                                             |
| Alta       | `app/api/incidents_new.py` mantém `MOCK_INCIDENTS`; `database_new.py` não é consumido pelas rotas de incidentes | Conteúdo se perde no reinício, inclusive quando há variáveis do banco configuradas    | SQLite em disco e transações entre documento, índice e auditoria                          |
| Alta       | API em FastAPI e pacote npm depende de `python`                                                                 | Diverge da stack Express esperada e não oferece execução Node da API                  | Entry point Express na porta 1992; Python legado desativado por padrão                    |
| Alta       | Modelo de incidente contém dificuldade, pontos, seed e resposta SQL                                             | Faltam sintomas, procedimento, validação e fontes de conhecimento                     | Documento de artigo estruturado, produto/categoria/seção e slug permanente                |
| Alta       | Conta MASTER automática, hash SHA-256 sem salt e sessões em memória sem expiração                               | A credencial de desenvolvimento poderia liberar exclusões se o legado fosse publicado | Sem senha padrão; scrypt; cookie HttpOnly; expiração, revogação e autorização no servidor |
| Média      | Busca anterior compara apenas título/descrição em lowercase                                                     | Não encontra conteúdo no procedimento e não normaliza acentos                         | FTS5, prefixos, relevância, filtros e parâmetros compartilháveis                          |
| Média      | `run_query` é simulação; ranking retorna zeros                                                                  | O nome do commit não comprova execução real de SQL nem conhecimento publicado         | A base não executa SQL de usuários; procedimentos de banco recebem indicação visual       |
| Média      | `src/pages/UsersPage.tsx` importa `Button` sem uso                                                              | O build original falha com TS6133                                                     | Remoção do import e build verificado                                                      |

Além disso, a auditoria npm apontou sete pacotes com alertas altos no frontend, incluindo dependências legadas e ferramentas de build. Foram aplicadas atualizações compatíveis e renovado o lockfile. A auditoria posterior não reportou vulnerabilidades no frontend nem nas dependências de produção da API em 05/11/2026. O frontend foi validado com React Router 8.5.1, Axios 1.21.0 e Vite 8.3.6.

## Regras preservadas

| Papel/fluxo            | Comportamento                                                      |
| ---------------------- | ------------------------------------------------------------------ |
| Equipe, sem login      | Lê, pesquisa, cria e edita publicados                              |
| Suporte em `/admin`    | Gerencia rascunhos, publicação, exclusão e restauração             |
| Exclusão               | Move para lixeira; o artigo sai da busca e do link público         |
| Restauração            | Volta como rascunho e exige decisão explícita para republicar      |
| Instalação interna     | HTTP, porta 1992, frontend e API na mesma origem                   |
| Procedimentos de banco | Identificação visual “Alteração direta no banco · N2 / Supervisor” |

A colaboração aberta é uma decisão do produto. A autoria dessas mudanças aparece como `equipe-sem-login`; não há identificação individual nem promessa de prevenção de todas as alterações indevidas. Rascunhos e lixeira não aparecem em busca, links públicos ou facetas. A edição pública não pode mudar a situação para rascunho, acessar um rascunho ou excluir o artigo.

## Referências pesquisadas e aplicação

| Referência                                                                                                                                                  | Observação                                                          | Aplicação nesta proposta                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [Base VSM](https://www.vsm.com.br/areadocliente/baseConhecimento)                                                                                           | Produtos na navegação, pesquisa por título e tópicos recentes       | Produto como filtro, links para as fontes e ordenação por atualização                                   |
| [Erros SNGPC — VSM](https://www.vsm.com.br/areadocliente/baseConhecimentoTopico?idTopico=884)                                                               | Vários erros em uma página longa, consultada pelo acesso autorizado | Sínteses separadas para CPF/RT e saldo/lote; nenhum roteiro de alteração de inventário foi automatizado |
| [Gerenciador — VSM](https://www.vsm.com.br/areadocliente/baseConhecimentoTopico?idTopico=1062)                                                              | Contexto das movimentações e dos retornos XML                       | Artigo de triagem com orientação para consultar o retorno                                               |
| [Conferência — VSM](https://www.vsm.com.br/areadocliente/baseConhecimentoTopico?idTopico=674)                                                               | Tutorial de conferência e informação de versão                      | Artigo sobre quarentena, com indicação da versão descrita na fonte                                      |
| [Envio XML — VSM](https://www.vsm.com.br/areadocliente/baseConhecimentoTopico?idTopico=173)                                                                 | Distingue transmissão e consulta de resultado                       | Artigo sobre consulta do retorno, sem equiparar alteração local ao aceite                               |
| [Estrutura de conteúdo — Zendesk](https://support.zendesk.com/hc/en-us/articles/4408845897370-Organizing-knowledge-base-content-in-categories-and-sections) | Categorias, seções e artigos; visibilidade de rascunhos             | Hierarquia simples e rascunhos restritos                                                                |
| [Busca de artigos — Zendesk](https://developer.zendesk.com/api-reference/help_center/help-center-api/help_center_search/)                                   | Pesquisa pública, relevância, filtros e paginação                   | Busca sem login, filtros por contexto e relevância de título/resumo                                     |
| [Express](https://expressjs.com/advanced/best-practice-security/) e [SQLite FTS5](https://www.sqlite.org/fts5.html)                                         | Validação/cabeçalhos e indexação textual                            | Zod, Helmet, parâmetros SQL e índice transacional                                                       |

As referências orientam estrutura e comportamento; não há dependência de Zendesk ou cópia de seu produto. A base VSM foi lida em modo de consulta. Não foram enviados formulários de alteração para a VSM. URLs com credenciais não foram incluídas no código ou no catálogo.

## Conteúdo inicial

| Artigo                                                | Situação                                       |
| ----------------------------------------------------- | ---------------------------------------------- |
| Erros SNGPC: por onde começar                         | Publicado pelo seed                            |
| CPF do XML diferente do responsável técnico           | Publicado pelo seed                            |
| Quantidade vendida maior que o estoque no SNGPC       | Publicado pelo seed                            |
| Conferir um lote de controlado em quarentena          | Publicado pelo seed                            |
| Consultar o retorno de um XML enviado ao SNGPC        | Publicado pelo seed                            |
| SNGPC: quantidade igual a zero — validar procedimento | Rascunho; causa/correção ainda não confirmadas |

O seed é explícito e idempotente: não sobrescreve conteúdo editado, não duplica registros e não ressuscita exclusões. Os textos são sínteses próprias, com fonte identificada. Não incluem credenciais, dados de clientes ou consultas SQL de manutenção. Produto, categoria e seção não são fixos: novos artigos podem cobrir outras rotinas além de SNGPC.

## Verificação e limites

- API: onze testes HTTP com SQLite temporário, incluindo colaboração sem login, autorização de exclusão, rascunhos invisíveis, conflitos, restauração, expiração/revogação de sessão, validação, limites, persistência e entrega da SPA em HTTP.
- Frontend: oito testes de componentes com React Testing Library/jsdom, incluindo busca/filtros, resposta atrasada, erro de rede, editor administrativo, edição pública, conflito e texto com marcação HTML.
- Build de produção e lint executados. Os seis avisos de lint restantes pertencem aos contextos legados preservados, sem novos avisos no módulo de conhecimento.
- A revisão visual em navegador da implementação nova permanece pendente: o navegador conectado acessa outra instância local e o navegador separado não alcança o processo de execução. Os testes de componentes não substituem uma inspeção visual em desktop e celular.
- O build novo não foi instalado no computador do usuário e nenhuma branch principal foi substituída. Os dois incrementos devem ser revisados e adotados juntos.

SQLite atende uma instalação interna com disco persistente e processo único. Não foi configurado armazenamento distribuído, importação do JSON da instalação anterior ou alteração de Supabase. A auditoria é de ações; a próxima evolução indicada é preservar o texto de cada revisão e permitir recuperação de edições, especialmente porque a colaboração é aberta.
