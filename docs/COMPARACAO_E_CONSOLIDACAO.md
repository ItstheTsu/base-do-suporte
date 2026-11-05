# Comparação e consolidação — 05/11/2026

## Fontes e limites

Foram consultados os arquivos das branches principais dos dois repositórios e a interface da Base do Suporte em execução na rede interna. A interface confirmou cinco artigos de SNGPC, cadastro/edição sem login, exclusão administrativa e um formulário com várias seções, prints, legendas e colagem por Ctrl+V.

O arquivo anexado `base-do-suporte-http-1992.zip` foi recebido, mas sua leitura está bloqueada pela indisponibilidade do ambiente de execução/arquivos da conversa. Esta comparação é **funcional**, baseada no site em execução e no código do GitHub; não é uma afirmação de comparação byte a byte do ZIP. Não foram alterados os dados da instância em execução.

## Recursos comparados

| Recurso | Site anterior em execução | Versão separada dos repositórios | Versão consolidada |
| --- | --- | --- | --- |
| Consulta/cadastro/edição sem login geral | Presente | Presente após os PRs | Preservado |
| Exclusão restrita ao suporte | Presente | Presente, com lixeira | Preservada com restauração como rascunho |
| Busca e categorias | Presente | FTS5, filtros e relevância | Mantidos; resumos mais leves e facetas sem recálculo no cliente a cada busca |
| Mensagem de erro separada | Presente | Incorporada ao texto de sintomas | Campo próprio acrescentado |
| Consulta versus alteração no banco | Distinção explícita | Indicador booleano | Três opções e escalonamento independente |
| Seções por artigo | Presente | Passos em uma lista única | Seções, títulos, passos e imagens vinculadas |
| Prints por arquivo/Ctrl+V | Presente no formulário | Ausente | Acrescentado, com limites e prévia temporária |
| Inicialização | Projeto antigo próprio | Dois repositórios vizinhos | Uma pasta, uma instalação e CMD na raiz |

## Otimizações concretas

- Código de desafios SQL e Python preservado no arquivo histórico, fora do runtime, do TypeScript e da busca de classes CSS.
- Remoção de dependências diretas não usadas pelo produto ativo, incluindo Axios, toast e masonry.
- Páginas de artigo, edição e administração carregadas sob demanda.
- Listagem pública envia resumos, sem carregar corpos completos e imagens.
- Facetas agregadas em SQL e consultadas separadamente dos termos da busca.
- Bundles com hash usam cache imutável; imagens são carregadas sob demanda.
- Imagens guardadas como BLOB no SQLite, sem base64 no JSON do artigo ou no índice de busca.
- Cache local da instalação e da compilação; uma única árvore de dependências.

Não foi realizado benchmark da rede interna. As alterações acima descrevem medidas implementadas; não representam uma estimativa de ganho percentual.

## Imagens e compatibilidade

Os artigos anteriores de texto continuam válidos. Campos novos são opcionais no cliente e têm valores padrão no servidor. Cada seção admite até 10 PNG/JPG de 5 MB. A API confere assinatura básica e tipo; SVG e conteúdo incompatível são recusados. A prévia anônima usa um token temporário que não é gravado no artigo. O link definitivo fica disponível para artigos publicados ou para o suporte autenticado.

O upload total por banco é limitado a 512 MiB. Arquivos sem referência são recolhidos depois de 24 horas em um próximo envio. Imagens referenciadas por artigos na lixeira são preservadas para permitir restauração.

A colagem usa o evento de paste do campo, que funciona no fluxo HTTP da rede interna, sem depender de leitura programática da área de transferência em contexto HTTPS.

## Preservação

O inventário em `migration/source-manifest.json` registra o repositório de origem, o caminho, o SHA do blob e o caminho da cópia preservada. As cópias não incluem dados locais, `.env` real ou `node_modules`, que não estavam no GitHub. Esses dados devem ser migrados da instalação antiga separadamente.

As cópias são um snapshot dos arquivos, não um backup completo de todos os históricos Git, issues, pull requests, configurações e permissões dos repositórios. A exclusão dos originais permanece pendente de concluir o acesso ao ZIP e validar a migração, além das confirmações exigidas pelo GitHub.

## Verificação

Há 15 cenários HTTP da API, dez testes de interface e um smoke do build. O GitHub Actions executa a aplicação em Linux/Windows e testa a inicialização pelo CMD no Windows. O status da execução é a evidência de aprovação; eventuais falhas devem ser corrigidas antes de adotar a versão consolidada.
