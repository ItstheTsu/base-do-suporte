$ErrorActionPreference = 'Stop'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    try {
        $arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '"'
        $elevated = Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList $arguments -Verb RunAs -Wait -PassThru
        exit $elevated.ExitCode
    } catch { [Console]::Error.WriteLine('A liberacao da porta precisa de permissao de administrador.'); exit 1 }
}
try {
    $rule = Get-NetFirewallRule -Name 'BaseDoSuporte-TCP-1992-LAN' -ErrorAction SilentlyContinue
    if ($rule) { Remove-NetFirewallRule -Name 'BaseDoSuporte-TCP-1992-LAN' }
    New-NetFirewallRule -Name 'BaseDoSuporte-TCP-1992-LAN' -DisplayName 'Base do Suporte - rede local TCP 1992' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 1992 -Profile Private,Domain -RemoteAddress LocalSubnet | Out-Null
    Write-Host 'Porta TCP 1992 liberada para a sub-rede local nos perfis Privado e Dominio.'
    Write-Host 'Se a rede estiver como Publica, solicite ao responsavel a configuracao da rede confiavel.'
} catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
if ($env:BASE_NO_PAUSE -ne '1') { Read-Host 'Pressione Enter para fechar' | Out-Null }
