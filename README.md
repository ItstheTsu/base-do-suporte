# Base do Suporte

Aplicação unificada de conhecimento para rotinas de suporte: **React + TypeScript + Express**, HTTP na porta **1992** e persistência SQLite. Não é mais necessário manter frontend e API em pastas de repositórios diferentes.

## Iniciar no Windows

1. Baixe ou clone este repositório e extraia **todos os arquivos** em uma pasta.
2. Dê dois cliques em **INICIAR_SITE.cmd**, na raiz do projeto.

Não é necessário instalar Node.js ou executar npm manualmente. Se não encontrar Node.js 24 com npm, o CMD baixa a distribuição oficial para Windows x64/ARM64, verifica o SHA-256 e a prepara em `%LOCALAPPDATA%\BaseDoSuporte\runtime`. Essa preparação não exige administrador nem altera o PATH permanente do Windows.

O CMD fecha a janela automaticamente e prepara a aplicação em **segundo plano**: verifica a porta, instala dependências, compila o site e abre o navegador depois de confirmar que o servidor respondeu. Na primeira execução, aguarde o download do Node e dos pacotes; as seguintes reaproveitam a instalação e o build válidos. Não é necessário manter uma janela CMD aberta.

| Arquivo | Ação |
| --- | --- |
| `INICIAR_SITE.cmd` | Prepara e inicia; se a mesma instância já estiver ativa, abre o site sem duplicar o servidor. |
| `PARAR_SITE.cmd` | Encerra a instância desta pasta e libera a porta. |
| `VER_LOGS.cmd` | Abre os registros de inicialização e erros. |
| `ENDERECO_DO_SITE.txt` | Gerado após iniciar, com os endereços do computador e da rede. |
| `LIBERAR_REDE.cmd` | Se necessário, cria uma regra de Firewall do Windows para TCP 1992, limitada à sub-rede local nos perfis Privado e Domínio; solicita elevação do Windows. |

O site escuta em **`0.0.0.0:1992`**. O navegador abre o IP detectado da rede, por exemplo `http://172.20.80.35:1992/`; o endereço do seu computador pode ser diferente e fica no arquivo de endereços. O acesso local `http://localhost:1992/` também funciona. A API, os artigos e as imagens usam a mesma origem, inclusive ao cadastrar e editar por IP. Para outros computadores acessarem, eles devem alcançar esse computador na rede e o firewall deve permitir a porta.

O `.env` existente e os dados são preservados. O inicializador ativa `HOST=0.0.0.0` no processo, mesmo quando um `.env` anterior aponta para loopback; a porta padrão continua 1992 (`PORT` pode ser configurada). Administração em `/admin`. Para um DNS específico, configure `PUBLIC_ORIGIN` no `.env`. Para HTTPS, configure a origem HTTPS e `COOKIE_SECURE=true`.

Os logs ficam em `logs/site.log`, `logs/erros.log` e `logs/gerenciador.log`. Se a preparação falhar, o registro de erro abre automaticamente. O processo continua depois de fechar o navegador; use `PARAR_SITE.cmd` antes de atualizar os arquivos. O comando de parar verifica PID, instante de criação e pasta da instância e solicita o encerramento do servidor; só usa finalização forçada da própria árvore se ela não responder. Não há instalação de serviço nem inicialização automática ao ligar o Windows.


Não há senha padrão. Para configurar o usuário `suporte`, execute `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-windows.ps1 -PasswordHash` na pasta do projeto e copie o hash gerado para `SUPPORT_PASSWORD_HASH` no `.env`. Esse comando também usa o Node.js preparado pelo CMD. O hash fica somente no servidor; senhas não são armazenadas no navegador. A colaboração pública funciona mesmo antes de configurar a administração.

Veja a [revisão da interface, da rede e da execução em segundo plano](docs/REVISAO_INTERFACE_E_REDE.md), com capturas e validação.

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

Para desenvolver, `npm run dev` inicia interface com atualização automática e API juntas na porta 1992, com banco separado em `data/development.sqlite`. Não execute junto com a versão pronta na mesma porta. A página `/test/responsive.html` ajuda a verificar a interface em 320, 390 e 768 px. Esse arquivo de teste não entra no build de produção.

O workflow executa testes, build, lint e smoke em Linux e Windows. No Windows verifica se o CMD fecha, se o servidor continua respondendo pelo IP real da LAN, se dois cliques evitam duplicação, se os dados de configuração são preservados e se `PARAR_SITE.cmd` libera a porta. Também testa instalação do zero sem Node pré-configurado e reinicialização com cache, usando uma pasta com espaços. Um registro de PID divergente deve ser recusado sem encerrar outro processo.

O build fica disponível nos artefatos da execução em Actions. Consulte o resultado da revisão antes de presumir aprovação.


## Dados e migração

Artigos e imagens ficam no mesmo SQLite em `data/knowledge.sqlite`. Antes de atualizar uma instalação existente, encerre o serviço e copie o diretório de dados completo. O seed é idempotente e não apaga edições nem restaura artigos excluídos.

O projeto contém as cópias dos repositórios e os recursos identificados na interface antiga em funcionamento. **O ZIP anterior ainda não foi inspecionado nesta sessão**, portanto não há migração automática validada do JSON, das imagens ou dos dados da instalação antiga. Não substitua esses dados por um banco vazio. Os repositórios originais devem permanecer disponíveis até concluir essa comparação e a validação da migração.

Veja [a comparação funcional e as decisões](docs/COMPARACAO_E_CONSOLIDACAO.md) e [o inventário dos arquivos preservados](migration/source-manifest.json).

