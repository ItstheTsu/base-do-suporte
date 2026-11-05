# Base do Suporte

Interface React/TypeScript para consultar, criar e editar artigos de suporte. Este incremento propõe aproximar estes repositórios do objetivo da Base do Suporte; os arquivos anteriores implementavam IncidentSQL, um laboratório de desafios SQL.

## O que está disponível

- Leitura, cadastro e edição de artigos sem login geral, conforme o fluxo da equipe na rede interna.
- Busca no título, resumo, sintomas, causa, passos, validação, cuidados e tags. Ignora acentos e caixa, aceita prefixos e prioriza título/resumo.
- Filtros por produto, categoria, seção e palavra-chave; paginação, ordenação e busca compartilhável pela URL.
- Artigos com endereço permanente, índice de leitura, fontes públicas, atualização e conteúdo relacionado.
- Indicação de alteração direta no banco para procedimentos N2 / Supervisor.
- Área administrativa em `/admin`, com usuário `suporte`, sessão HttpOnly, rascunhos, publicação, lixeira e restauração.
- Sem senha padrão ou credenciais no navegador. O hash da senha fica apenas na configuração da API.

## Executar com a API

Use Node.js 24 e mantenha os dois repositórios lado a lado:

```text
projeto/
  support-repository/
  support-repository-api/
```

Compile o frontend:

```bash
npm ci
npm run build
```

Na pasta `support-repository-api`, siga o README correspondente para configurar o acesso administrativo, executar `npm run seed` e iniciar com `npm start`. O Express serve o build e a API em **HTTP na porta 1992**. Configure `PUBLIC_ORIGIN` na API com o IP interno do servidor. Nenhuma variável secreta é necessária no frontend.

Em desenvolvimento, execute a API na porta 1992 e `npm run dev` neste repositório. O Vite usa 5173 e encaminha `/api` para o Express. Para isso, deixe `NODE_ENV=development` na API.

## Verificação

```bash
npm test
npm run build
npm run lint
```

Os oito testes de interface usam React Testing Library e jsdom. Cobrem busca/filtros, resposta atrasada, recuperação de erro, conflito de edição, rascunho administrativo, permissão do editor e renderização de texto sem interpretar HTML. A API tem testes HTTP reais independentes.

Os avisos de lint remanescentes pertencem aos contextos antigos do IncidentSQL. O novo módulo não acrescenta avisos.

## Escopo e integração

O frontend novo está em `src/knowledge`. Os componentes antigos de IncidentSQL foram preservados no repositório, mas não fazem parte das rotas desta proposta. Não se deve combinar este frontend com a API FastAPI antiga: os contratos novos são `/api/articles`, `/api/session` e `/api/support`.

Este trabalho não migra nem substitui a Base do Suporte que já roda no computador do usuário. Antes de trocar essa instalação, é necessário identificar seus arquivos e migrar seu conteúdo. O catálogo inicial contém cinco sínteses públicas de SNGPC com fontes VSM e um rascunho de quantidade zero, ainda pendente de validação.

Consulte [a revisão e as decisões de implementação](docs/REVISAO_BASE_DO_SUPORTE.md).
