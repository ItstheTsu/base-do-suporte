param([Parameter(Mandatory=$true)][string]$ProjectRoot, [switch]$Clean)
$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$env:BASE_NO_OPEN = '1'
$env:BASE_NO_PAUSE = '1'
$env:PORT = if ($Clean) { '22992' } else { '21992' }
$env:PUBLIC_ORIGIN = 'http://localhost:' + $env:PORT
$env:DATABASE_PATH = Join-Path $env:RUNNER_TEMP ('launcher-' + $env:PORT + '.sqlite')
Copy-Item -LiteralPath (Join-Path $ProjectRoot '.env.example') -Destination (Join-Path $ProjectRoot '.env')
Add-Content -LiteralPath (Join-Path $ProjectRoot '.env') -Value "`nHOST=127.0.0.1`nEXISTING_SETTING=preservar"
$originalEnv = [IO.File]::ReadAllText((Join-Path $ProjectRoot '.env'))
$firstStamps = @{}
function Run-Cmd([string]$Name) {
    $process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/d', '/c', $Name -WorkingDirectory $ProjectRoot -NoNewWindow -PassThru
    if (-not $process.WaitForExit(180000)) { throw "$Name manteve a janela CMD aberta." }
    if ($process.ExitCode -ne 0) { throw "$Name falhou com codigo $($process.ExitCode)." }
}
function Read-Json([string]$Path) { return (Get-Content -LiteralPath (Join-Path $ProjectRoot $Path) -Raw | ConvertFrom-Json) }
function Is-Healthy {
    try { return (Invoke-RestMethod ('http://127.0.0.1:' + $env:PORT + '/api/health') -TimeoutSec 1).service -eq 'base-do-suporte' }
    catch { return $false }
}
for ($round = 1; $round -le 2; $round++) {
    try {
        Run-Cmd 'INICIAR_SITE.cmd'
        $ready = $false
        for ($attempt = 0; $attempt -lt 240; $attempt++) {
            if (Is-Healthy) { $ready = $true; break }
            $state = Read-Json '.cache/service.json'
            if (-not (Get-Process -Id $state.pid -ErrorAction SilentlyContinue)) { throw 'O preparador encerrou antes de iniciar o site.' }
            Start-Sleep -Seconds 2
        }
        if (-not $ready) { throw 'O site nao ficou disponivel no prazo.' }
        $state = Read-Json '.cache/service.json'
        $access = Read-Json '.cache/ready.json'
        if (-not (Get-Process -Id $state.pid -ErrorAction SilentlyContinue)) { throw 'O site nao permaneceu em segundo plano.' }
        if (-not $access.network.Count) { throw 'Nenhum endereco da rede foi anunciado.' }
        $lan = Invoke-RestMethod ($access.network[0] + '/api/health') -TimeoutSec 5 -NoProxy
        if ($lan.service -ne 'base-do-suporte') { throw 'O site nao respondeu pelo IP da rede.' }
        foreach ($required in @('node_modules', 'dist/index.html', 'ENDERECO_DO_SITE.txt')) {
            if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot $required))) { throw "O CMD nao preparou $required." }
        }
        if ([IO.File]::ReadAllText((Join-Path $ProjectRoot '.env')) -cne $originalEnv) { throw 'O inicializador sobrescreveu o .env existente.' }
        foreach ($stamp in @('.cache/dependencies.sha256', '.cache/frontend.sha256')) {
            $file = Get-Item -LiteralPath (Join-Path $ProjectRoot $stamp)
            if ($round -eq 1) { $firstStamps[$stamp] = $file.LastWriteTimeUtc }
            elseif ($file.LastWriteTimeUtc -ne $firstStamps[$stamp]) { throw "A segunda inicializacao refez $stamp sem necessidade." }
        }
        $log = Get-Content -LiteralPath (Join-Path $ProjectRoot 'logs/site.log') -Raw
        $prepareLog = Get-Content -LiteralPath (Join-Path $ProjectRoot 'logs/preparacao.log') -Raw
        if ($prepareLog -match 'DEP0190') { throw 'A chamada ao npm ainda usa a forma depreciada com shell.' }
        if ($log -match 'npm ci|npm run build') { throw 'A instalacao ou o build ocorreram no processo em segundo plano.' }
        Run-Cmd 'INICIAR_SITE.cmd'
        $duplicate = Read-Json '.cache/service.json'
        if ($duplicate.pid -ne $state.pid) { throw 'Clicar duas vezes iniciou uma segunda instancia.' }
        Write-Host "CMD validado: rodada $round, janela fechada, processo em segundo plano e acesso pela LAN."
    } finally {
        try { Run-Cmd 'PARAR_SITE.cmd' } finally {
            foreach ($logFile in @('site.log', 'erros.log', 'gerenciador.log')) {
                $path = Join-Path $ProjectRoot ('logs/' + $logFile)
                if (Test-Path -LiteralPath $path) { Get-Content -LiteralPath $path }
            }
        }
    }
    if (Is-Healthy) { throw 'PARAR_SITE.cmd deixou o servidor respondendo.' }
    Write-Host 'Encerramento validado: a porta foi liberada e o servidor encerrou.'
}
# A stale record must never authorize killing an unrelated process.
$unrelated = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList '-e', '"setTimeout(()=>{},60000)"' -PassThru
try {
    $fake = @{pid=$unrelated.Id; startedAt='2000-01-01T00:00:00.0000000Z'; projectRoot=$ProjectRoot; instance='registro-invalido'}
    [IO.File]::WriteAllText((Join-Path $ProjectRoot '.cache/service.json'), ($fake | ConvertTo-Json -Compress))
    $stop = Start-Process -FilePath 'cmd.exe' -ArgumentList '/d', '/c', 'PARAR_SITE.cmd' -WorkingDirectory $ProjectRoot -NoNewWindow -Wait -PassThru
    if ($stop.ExitCode -eq 0 -or $unrelated.HasExited) { throw 'A protecao de identidade do processo falhou.' }
    Write-Host 'Protecao validada: um PID com identidade divergente nao foi encerrado.'
} finally {
    if (-not $unrelated.HasExited) { Stop-Process -Id $unrelated.Id -Force }
    Remove-Item -LiteralPath (Join-Path $ProjectRoot '.cache/service.json') -Force -ErrorAction SilentlyContinue
}
