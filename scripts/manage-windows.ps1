param([ValidateSet('Start','Stop','Logs')][string]$Action = 'Start')
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$projectRoot = Split-Path -Parent $PSScriptRoot
$cache = Join-Path $projectRoot '.cache'
$logs = Join-Path $projectRoot 'logs'
$statePath = Join-Path $cache 'service.json'
$readyPath = Join-Path $cache 'ready.json'
$stopPath = Join-Path $cache 'stop.json'
$supervisorScript = Join-Path $PSScriptRoot 'start-windows.ps1'
New-Item -ItemType Directory -Path $cache, $logs -Force | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-JsonFile([string]$Path) {
    if (Test-Path -LiteralPath $Path) { return (Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json) }
    return $null
}
function Write-JsonFile([string]$Path, $Value) {
    [System.IO.File]::WriteAllText($Path, ($Value | ConvertTo-Json -Compress), $utf8)
}
function Get-OwnedProcess($State) {
    if (-not $State) { return $null }
    if ($State.projectRoot -ne $projectRoot -or $State.script -ne $supervisorScript) {
        if ($Action -eq 'Start') { return $null }
        throw 'O registro de inicializacao pertence a outra pasta. Nenhum processo foi encerrado.'
    }
    try { $process = [System.Diagnostics.Process]::GetProcessById([int]$State.pid) } catch { return $null }
    if ($process.HasExited) { return $null }
    if ($process.ProcessName -ne 'powershell' -or $process.StartTime.ToUniversalTime().ToString('o') -ne $State.startedAt) {
        if ($Action -eq 'Start') { return $null }
        throw 'O PID foi reutilizado ou nao pertence a esta inicializacao. Nenhum processo foi encerrado.'
    }
    return $process
}
function Open-Log([string]$Path) {
    if ($env:BASE_NO_OPEN -ne '1' -and (Test-Path -LiteralPath $Path)) {
        Start-Process -FilePath 'notepad.exe' -ArgumentList ('"' + $Path + '"') | Out-Null
    }
}
$lock = $null
try {
    if ($Action -eq 'Logs') {
        Open-Log (Join-Path $logs 'site.log')
        $errors = Join-Path $logs 'erros.log'
        if ((Test-Path -LiteralPath $errors) -and (Get-Item -LiteralPath $errors).Length -gt 0) { Open-Log $errors }
        exit 0
    }
    try { $lock = [System.IO.File]::Open((Join-Path $cache 'service.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
    catch [System.IO.IOException] { exit 0 }
    $state = Read-JsonFile $statePath
    $owned = Get-OwnedProcess $state
    if ($Action -eq 'Stop') {
        if ($owned) {
            $ready = Read-JsonFile $readyPath
            if ($ready) {
                Write-JsonFile $stopPath @{pid=$ready.pid; instance=$ready.instance}
                for ($attempt = 0; $attempt -lt 40; $attempt++) {
                    if ($owned.HasExited) { break }
                    Start-Sleep -Milliseconds 250
                    $owned.Refresh()
                }
            }
            if (-not $owned.HasExited) {
                # Recheck PID identity immediately before the fallback tree termination.
                $verified = Get-OwnedProcess $state
                if ($verified) {
                    & taskkill.exe /PID $verified.Id /T /F | Out-Null
                    if ($LASTEXITCODE -ne 0 -and -not $verified.HasExited) { throw 'Nao foi possivel encerrar esta instancia.' }
                }
            }
        }
        foreach ($path in @($statePath, $readyPath, $stopPath)) {
            if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
        }
        exit 0
    }
    if ($owned) {
        $ready = Read-JsonFile $readyPath
        if ($ready -and $env:BASE_NO_OPEN -ne '1') { Start-Process -FilePath $ready.url | Out-Null }
        exit 0
    }
    foreach ($path in @($readyPath, $stopPath)) {
        if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
    }
    $env:BASE_BACKGROUND = '1'
    $arguments = '-NoLogo -NoProfile -ExecutionPolicy Bypass -File "' + $supervisorScript + '"'
    $process = Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logs 'site.log') -RedirectStandardError (Join-Path $logs 'erros.log')
    Write-JsonFile $statePath @{pid=$process.Id; startedAt=$process.StartTime.ToUniversalTime().ToString('o'); projectRoot=$projectRoot; script=$supervisorScript}
    exit 0
} catch {
    $errorPath = Join-Path $logs 'gerenciador.log'
    [System.IO.File]::AppendAllText($errorPath, ([DateTime]::Now.ToString('s') + ' ERRO: ' + $_.Exception.Message + [Environment]::NewLine), $utf8)
    [Console]::Error.WriteLine($_.Exception.Message)
    Open-Log $errorPath
    exit 1
} finally {
    if ($lock) { $lock.Dispose() }
}
