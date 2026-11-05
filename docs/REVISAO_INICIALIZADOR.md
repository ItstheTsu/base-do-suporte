# Alerta do Defender e revisão da inicialização

O Windows do usuário bloqueou o arquivo `base-do-suporte-main (2).zip` com o nome `Trojan:Script/Wacatac.B!ml`. O histórico informa que o arquivo foi removido. Esse evento não deve ser confundido com um aviso de reputação do SmartScreen. A classificação de falso positivo não foi confirmada nesta revisão.

## O que foi revisto

- Foram lidos os arquivos textuais preservados em `archive/` e revisados os scripts ativos de inicialização. O código recebido desses repositórios não apresentou os padrões de execução oculta, alteração do Defender ou comandos codificados procurados nesta revisão. Isso é uma verificação estática delimitada, não um laudo antimalware.
- O lockfile ativo aponta os pacotes para `registry.npmjs.org`. A única dependência marcada com script de instalação no lockfile consultado é `fsevents`, opcional de macOS. Dependências e avisos de segurança continuam sendo verificados pela CI; `npm audit` não substitui antivírus.
- O iniciador anterior combinava PowerShell com execução oculta e política de execução por processo, preparando um runtime baixado. Esse desenho foi substituído por uma preparação visível e pelo instalador oficial do Node.js via WinGet quando necessário. Não é possível atribuir a detecção a um arquivo interno específico apenas pela captura fornecida, que identifica o ZIP.

## Correções funcionais

| Ocorrência | Correção |
| --- | --- |
| `DEP0190` ao chamar npm com argumentos e shell | O Node executa `npm-cli.js` diretamente, com lista de argumentos e `shell: false`. O aviso não é suprimido. |
| Falha genérica na verificação de saúde | Até 90 segundos de espera, consulta direta a `127.0.0.1`, diagnóstico da resposta HTTP, código/sinal de saída e arquivos de log. |
| Consulta de adaptadores interrompendo o início | Falha de enumeração é registrada; o servidor continua escutando em `0.0.0.0`. |
| Acesso por IP sem adaptadores enumerados | A origem HTTP pode ser validada pelo endereço e pela porta locais do socket que recebeu a própria conexão. Origens externas continuam bloqueadas. |
| Instalação em processo oculto | Dependências, build e conteúdo são preparados em primeiro plano; apenas o servidor já preparado roda em segundo plano. |
| Uso de scripts PowerShell pelo aplicativo | Os scripts de aplicação foram removidos. Os CMDs chamam Node.js ou ferramentas administrativas normais do Windows. |
| Encerramento por PID | A aplicação solicita a parada da instância identificada pelo seu registro local; não força a finalização de outros processos. |

O Node.js 24 continua suportado e o Node.js 26 LTS foi incluído para acompanhar o instalador LTS oficial. Não há instalação de tarefas agendadas, serviços ou execução automática ao ligar o computador.

## Verificação e limites

Os testes funcionais verificam API, interface, prontidão, preparação visível, execução em segundo plano e parada. O workflow roda nas linhas Node.js 24 e 26. Há também uma verificação separada da disponibilidade do Microsoft Defender no executor Windows: quando o mecanismo está ativo, os arquivos de origem anterior e revisada são analisados; quando não está, o relatório informa `unavailable` e não certifica o pacote.

Os ZIPs dessa verificação são reconstruídos a partir dos commits do Git. O hash exato do ZIP removido do computador do usuário não foi fornecido, portanto não há comprovação de identidade byte a byte com o arquivo do alerta. O resultado funcional da CI e a ausência de falhas em `npm audit` não comprovam a resolução da classificação do Defender.

O iniciador não adiciona exclusões, não desbloqueia arquivos, não desativa proteção e não modifica políticas de execução. Se uma versão revisada também for bloqueada, preserve o bloqueio e obtenha o resultado da análise oficial; não restaure o pacote antigo para contornar a detecção.

Referências oficiais: [DEP0190 no Node.js](https://nodejs.org/api/deprecations.html#dep0190-passing-args-to-nodechild_process-execfilespawn-with-shell-option-true), [Node.js 26 LTS](https://nodejs.org/en/blog/release/v26.13.0), [WinGet install](https://learn.microsoft.com/windows/package-manager/winget/install), [histórico de proteção](https://support.microsoft.com/windows/security/windows-security/protection-history-in-the-windows-security-app) e [envio de arquivo para análise da Microsoft](https://www.microsoft.com/en-us/wdsi/filesubmission).

## Diagnóstico de uma instalação

Execute `VER_LOGS.cmd` para consultar preparação, servidor, erros e gerenciador. `INICIAR_DEBUG.cmd` mantém a execução em primeiro plano para diagnóstico. Atualizações devem preservar `.env` e `data/`. O IP é gerado em `ENDERECO_DO_SITE.txt`; caso o sistema bloqueie a descoberta dos adaptadores, use o IP mostrado por `ipconfig`, com porta 1992.
