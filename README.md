# Base do Suporte

Aplicação unificada de conhecimento para rotinas de suporte: **React + TypeScript + Express**, HTTP na porta **1992** e persistência SQLite. Não é mais necessário manter frontend e API em pastas de repositórios diferentes.

## Iniciar no Windows

1. Instale o **Node.js 24 com npm**.
2. Baixe ou clone este repositório e extraia em uma pasta.
3. Dê dois cliques em **INICIAR_SITE.cmd**, na raiz do projeto.

O CMD verifica a porta, prepara uma única instalação de dependências, compila o site quando os arquivos mudam, adiciona o catálogo inicial sem sobrescrever os dados e abre o navegador após a API responder. Mantenha a janela aberta; Ctrl+C encerra o servidor. O primeiro início precisa de internet para baixar dependências. Os seguintes reutilizam a instalação e o build, quando continuam válidos.

O endereço padrão é `http://localhost:1992/`; o terminal também mostra os endereços da rede interna. Administração em `/admin`. O `.env` existente é preservado. Para um nome DNS específico, configure `PUBLIC_ORIGIN` no `.env`. O modo HTTP interno não exige certificados. Para HTTPS em uma instalação futura, configure a origem HTTPS e `COOKIE_SECURE=true`.

Não há senha padrão. Para configurar o usuário `suporte`, execute `npm run password:hash` e copie o hash gerado para `SUPPORT_PASSWORD_HASH` no `.env`. O hash fica somente no servidor; senhas não são armazenadas no navegador. A colaboração pública funciona mesmo antes de configurar a administração.

## Funcionalidades

- Consulta, cadastro e edição de publicados sem login geral. Exclusão e restauração somente pelo suporte.
- Busca sem distinção de acentos/caixa, prefixos e relevância, com filtros de produto, categoria, seção e tags.
- Artigos com mensagem de erro, sintomas, causa, validação, cuidados e fontes.
- Procedimentos com várias seções, passos, prints PNG/JPG, legendas e vinculação da imagem ao passo.
- Envio de prints por arquivo ou Ctrl+V. Até 5 MB por imagem e 10 imagens por seção; imagens grandes são reduzidas quando isso diminui o tamanho.
- Distinção entre consulta e alteração direta no banco, com marcação independente de N2 / Supervisor.
- Rascunhos e lixeira restritos; restauração como rascunho; conflitos de edição retornam 409 sem sobrescrever a versão mais recente.
- Nenhum endpoint executa SQL fornecido pelo usuário.

## Organização

| Caminho | Conteúdo |
| --- | --- |
| `src/client` | Interface React/TypeScript |
| `src/server` | API Express, persistência, sessão e imagens |
| `content` | Catálogo inicial de SNGPC |
| `data` | SQLite da instalação; ignorado pelo Git |
| `scripts` | Inicialização, senha e verificação integrada |
| `test` | Testes da API e da interface |
| `archive` | Cópias dos 102 arquivos originais dos dois repositórios; não entram no runtime |

Há um único `package.json`, `package-lock.json` e `node_modules`.

## Desenvolvimento e verificação

```bash
npm ci --include=dev
npm test
npm run build
npm run lint
npm run smoke
npm run seed
npm start
```

Para desenvolver a interface, mantenha `npm start` em um terminal e execute `npm run dev` em outro; use `NODE_ENV=development` para o proxy local da porta 5173. A aplicação pronta continua em 1992.

O workflow de verificação executa testes, build, lint e smoke em Linux e Windows. No Windows também inicia o CMD e consulta a API. O build fica disponível nos artefatos da execução. Consulte o resultado em Actions; não presuma aprovação enquanto a execução estiver pendente.

## Dados e migração

Artigos e imagens ficam no mesmo SQLite em `data/knowledge.sqlite`. Antes de atualizar uma instalação existente, encerre o serviço e copie o diretório de dados completo. O seed é idempotente e não apaga edições nem restaura artigos excluídos.

O projeto contém as cópias dos repositórios e os recursos identificados na interface antiga em funcionamento. **O ZIP anterior ainda não foi inspecionado nesta sessão**, portanto não há migração automática validada do JSON, das imagens ou dos dados da instalação antiga. Não substitua esses dados por um banco vazio. Os repositórios originais devem permanecer disponíveis até concluir essa comparação e a validação da migração.

Veja [a comparação funcional e as decisões](docs/COMPARACAO_E_CONSOLIDACAO.md) e [o inventário dos arquivos preservados](migration/source-manifest.json).
