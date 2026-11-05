# Base do Suporte

Aplicação unificada de conhecimento para rotinas de suporte: **React + TypeScript + Express**, HTTP na porta **1992** e persistência SQLite. Não é mais necessário manter frontend e API em pastas de repositórios diferentes.

## Iniciar no Windows

1. Baixe ou clone este repositório e extraia **todos os arquivos** em uma pasta.
2. Dê dois cliques em **INICIAR_SITE.cmd**, na raiz do projeto.

O CMD usa Node.js **24 ou 26 LTS com npm** já instalado; se não encontrar uma versão compatível, solicita a instalação oficial pelo WinGet (`OpenJS.NodeJS.LTS`, fonte `winget`). O instalador do Windows pode pedir elevação. Se o WinGet não estiver disponível, o CMD informa o endereço oficial para instalar Node.js com npm. Uma instalação portátil oficial preparada por uma versão anterior pode ser reaproveitada.

A preparação fica **visível**: instalação dos pacotes, compilação e conteúdo inicial. Depois disso, somente o servidor entra em segundo plano; o navegador abre quando a API confirma que está pronta, e a janela CMD fecha. As próximas execuções reutilizam as dependências e o build válidos.

O inicializador não executa arquivos PowerShell, não altera políticas de execução e não modifica configurações do antivírus. Isso não constitui uma garantia de classificação pelo Defender. Veja a [revisão do alerta e das falhas de inicialização](docs/REVISAO_INICIALIZADOR.md).


| Arquivo | Ação |
| --- | --- |
| `INICIAR_SITE.cmd` | Prepara e inicia; se a mesma instância já estiver ativa, abre o site sem duplicar o servidor. |
| `PARAR_SITE.cmd` | Encerra a instância desta pasta e libera a porta. |
| `VER_LOGS.cmd` | Abre os registros de preparação, servidor e erros. |
| `INICIAR_DEBUG.cmd` | Executa em primeiro plano para diagnóstico. |
| `ENDERECO_DO_SITE.txt` | Gerado após iniciar, com os endereços do computador e da rede. |
| `LIBERAR_REDE.cmd` | Se necessário, cria uma regra de Firewall do Windows para TCP 1992, limitada à sub-rede local nos perfis Privado e Domínio; execute como administrador quando necessário. |

O site escuta em **`0.0.0.0:1992`**. O navegador abre o IP detectado da rede, por exemplo `http://172.20.80.35:1992/`; o endereço do seu computador pode ser diferente e fica no arquivo de endereços. O acesso local `http://localhost:1992/` também funciona. A API, os artigos e as imagens usam a mesma origem, inclusive ao cadastrar e editar por IP. Para outros computadores acessarem, eles devem alcançar esse computador na rede e o firewall deve permitir a porta.

O `.env` existente e os dados são preservados. O inicializador ativa `HOST=0.0.0.0` no processo, mesmo quando um `.env` anterior aponta para loopback; a porta padrão continua 1992 (`PORT` pode ser configurada). Administração em `/admin`. Para um DNS específico, configure `PUBLIC_ORIGIN` no `.env`. Para HTTPS, configure a origem HTTPS e `COOKIE_SECURE=true`.

Os logs ficam em `logs/preparacao.log`, `logs/site.log`, `logs/erros.log` e `logs/gerenciador.log`. Se houver falha, o CMD permanece aberto com o erro. A verificação aguarda até 90 segundos e informa a URL testada, a última resposta e saídas antecipadas do processo. O diagnóstico local usa HTTP direto em loopback para não depender do proxy da rede.

O processo continua depois de fechar o navegador; use `PARAR_SITE.cmd` antes de atualizar. O comando de parar verifica o identificador da instância e solicita seu encerramento pelo canal local do aplicativo; não executa finalização de outros processos nem instala serviço ou inicialização automática ao ligar o Windows.


Não há senha padrão. Para configurar o usuário `suporte`, execute `GERAR_HASH_SENHA.cmd` na pasta do projeto e copie o hash gerado para `SUPPORT_PASSWORD_HASH` no `.env`. Esse comando também localiza o Node.js disponível para o aplicativo. O hash fica somente no servidor; senhas não são armazenadas no navegador. A colaboração pública funciona mesmo antes de configurar a administração.

Veja a [revisão da interface, da rede e da execução em segundo plano](docs/REVISAO_INTERFACE_E_REDE.md), com capturas e validação.

## Funcionalidades

- Consulta, cadastro e edição de publicados sem login geral. Exclusão e restauração somente pelo suporte.
- Busca sem distinção de acentos/caixa, prefixos e relevância, com filtros de produto, categoria, seção e tags.
- Artigos com mensagem de erro, sintomas, causa, validação, cuidados e referências opcionais. É possível publicar sem fontes; quando informadas, precisam de nome e link público HTTPS.
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

Para desenvolver, `npm run dev` inicia interface com atualização automática e API juntas na porta 1992, com banco separado em `data/development.sqlite`. Não execute junto com a versão pronta na mesma porta. A página `/test/responsive.html` ajuda a verificar a interface em 320, 390 e 768 px. Esse arquivo de teste não entra no build de produção.

O workflow executa testes, build, lint e smoke em Linux e Windows. No Windows verifica se o CMD fecha, se o servidor continua respondendo pelo IP real da LAN, se dois cliques evitam duplicação, se os dados de configuração são preservados e se `PARAR_SITE.cmd` libera a porta. Também testa a preparação do zero com Node LTS instalado, sem dependências ou build, e reinicialização com cache em uma pasta com espaços e `&`. Os testes não simulam a aprovação do instalador oficial pelo usuário. Um registro de PID divergente deve ser recusado sem encerrar outro processo.

O build fica disponível nos artefatos da execução em Actions. Consulte o resultado da revisão antes de presumir aprovação.


## Dados e migração

Artigos e imagens ficam no mesmo SQLite em `data/knowledge.sqlite`. Antes de atualizar uma instalação existente, encerre o serviço e copie o diretório de dados completo. O seed é idempotente e não apaga edições nem restaura artigos excluídos.

O projeto contém as cópias dos repositórios e os recursos identificados na interface antiga em funcionamento. **O ZIP anterior ainda não foi inspecionado nesta sessão**, portanto não há migração automática validada do JSON, das imagens ou dos dados da instalação antiga. Não substitua esses dados por um banco vazio. Os repositórios originais devem permanecer disponíveis até concluir essa comparação e a validação da migração.

Veja [a comparação funcional e as decisões](docs/COMPARACAO_E_CONSOLIDACAO.md) e [o inventário dos arquivos preservados](migration/source-manifest.json).

