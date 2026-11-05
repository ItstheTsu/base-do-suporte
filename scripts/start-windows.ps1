# Compatible with Windows PowerShell 5.1, included in Windows 10/11.
param([switch]$PasswordHash)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$ProgressPreference = 'SilentlyContinue'
$projectRoot = Split-Path -Parent $PSScriptRoot

function Test-NodeRuntime {
    param([string]$NodePath)
    if (-not (Test-Path -LiteralPath $NodePath -PathType Leaf)) { return $false }
    $nodeDirectory = Split-Path -Parent $NodePath
    if (-not (Test-Path -LiteralPath (Join-Path $nodeDirectory 'npm.cmd'))) { return $false }
    if (-not (Test-Path -LiteralPath (Join-Path $nodeDirectory 'node_modules\npm\bin\npm-cli.js'))) { return $false }
    try {
        $version = & $NodePath --version 2>$null
        return ($LASTEXITCODE -eq 0 -and "$version" -match '^v24\.\d+\.\d+$')
    } catch { return $false }
}

function Get-NodeRuntime {
    if ($env:BASE_FORCE_PORTABLE_NODE -ne '1') {
        $installed = @(Get-Command node.exe -CommandType Application -All -ErrorAction SilentlyContinue)
        foreach ($command in $installed) {
            if (Test-NodeRuntime $command.Source) { return $command.Source }
        }
    }

    $nativeArchitecture = $env:PROCESSOR_ARCHITEW6432
    if (-not $nativeArchitecture) { $nativeArchitecture = $env:PROCESSOR_ARCHITECTURE }
    $architecture = switch ($nativeArchitecture) {
        'AMD64' { 'x64' }
        'ARM64' { 'arm64' }
        default { throw 'Este projeto precisa de Windows de 64 bits (x64 ou ARM64).' }
    }
    $runtimeRoot = $env:BASE_RUNTIME_DIR
    if (-not $runtimeRoot) { $runtimeRoot = Join-Path $env:LOCALAPPDATA 'BaseDoSuporte\runtime' }
    $runtimeRoot = [System.IO.Path]::GetFullPath($runtimeRoot)
    $nodeHome = Join-Path $runtimeRoot "node24-win-$architecture"
    $cachedNode = Join-Path $nodeHome 'node.exe'
    if (Test-NodeRuntime $cachedNode) { return $cachedNode }

    Write-Host '[0/4] Baixando Node.js 24 com npm para o usuario atual...'
    Write-Host 'A primeira preparacao precisa de internet. Aguarde o download.'
    $temporaryDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ('base-node-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $temporaryDirectory -Force | Out-Null
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        $checksumPath = Join-Path $temporaryDirectory 'SHASUMS256.txt'
        Invoke-WebRequest -UseBasicParsing -Uri 'https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt' -OutFile $checksumPath -TimeoutSec 180
        $pattern = '(?m)^(?<hash>[a-fA-F0-9]{64})\s+(?<file>node-v24\.\d+\.\d+-win-' + $architecture + '\.zip)[ \t]*\r?$'
        $release = [regex]::Match((Get-Content -LiteralPath $checksumPath -Raw), $pattern)
        if (-not $release.Success) { throw 'A lista oficial de downloads nao contem o Node.js 24 para este Windows.' }
        $archiveName = $release.Groups['file'].Value
        $version = [regex]::Match($archiveName, 'v24\.\d+\.\d+').Value
        $archivePath = Join-Path $temporaryDirectory $archiveName
        # Pin the ZIP to the version in the manifest, even if latest changes mid-download.
        Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/$version/$archiveName" -OutFile $archivePath -TimeoutSec 600
        $actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
        if ($actualHash -ne $release.Groups['hash'].Value) {
            throw 'A verificacao SHA-256 do Node.js falhou. O arquivo nao sera executado; tente novamente.'
        }
        Expand-Archive -LiteralPath $archivePath -DestinationPath $temporaryDirectory -Force
        $extractedHome = Join-Path $temporaryDirectory ([System.IO.Path]::GetFileNameWithoutExtension($archiveName))
        if (-not (Test-NodeRuntime (Join-Path $extractedHome 'node.exe'))) {
            throw 'O download nao forneceu uma instalacao valida de Node.js 24 e npm.'
        }
        New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
        if (Test-Path -LiteralPath $nodeHome) { Remove-Item -LiteralPath $nodeHome -Recurse -Force }
        Move-Item -LiteralPath $extractedHome -Destination $nodeHome
        Write-Host 'Node.js 24 e npm preparados com sucesso.'
        return $cachedNode
    } finally {
        if (Test-Path -LiteralPath $temporaryDirectory) {
            Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

try {
    foreach ($requiredFile in @('package.json', 'package-lock.json', '.env.example', 'scripts\launch.mjs')) {
        if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $requiredFile))) {
            throw "Falta o arquivo $requiredFile. Extraia o projeto completo antes de iniciar."
        }
    }
    Set-Location -LiteralPath $projectRoot
    $nodePath = Get-NodeRuntime
    $env:PATH = (Split-Path -Parent $nodePath) + [System.IO.Path]::PathSeparator + $env:PATH
    if ($PasswordHash) {
        & $nodePath (Join-Path $PSScriptRoot 'hash-password.js')
    } else {
        Write-Host 'Preparando dependencias e iniciando a Base do Suporte...'
        & $nodePath (Join-Path $PSScriptRoot 'launch.mjs')
    }
    exit $LASTEXITCODE
} catch {
    [Console]::Error.WriteLine(('ERRO: ' + $_.Exception.Message))
    exit 1
}
