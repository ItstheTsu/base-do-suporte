param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$report = [ordered]@{ status='unavailable'; engine='Microsoft Defender Antivirus'; scans=@(); note='Availability is checked independently from functional tests. No exclusions or protection changes are applied.' }
try {
    $state = Get-MpComputerStatus -ErrorAction Stop
    $report.serviceEnabled = $state.AMServiceEnabled
    $report.antivirusEnabled = $state.AntivirusEnabled
    $report.signatureVersion = $state.AntivirusSignatureVersion
    if (-not $state.AMServiceEnabled -or -not $state.AntivirusEnabled) {
        $report.reason = 'The hosted runner does not have an active Defender scanning engine.'
    } else {
        Update-MpSignature -ErrorAction Stop
        $report.signatureVersion = (Get-MpComputerStatus).AntivirusSignatureVersion
        $report.status = 'completed'
        foreach ($entry in @(@{name='reported-source';revision='7aebdbd49d4299bfad461978e8e1ad0db2a1cd98'},@{name='revised-source';revision='HEAD'})) {
            $zip = Join-Path $OutputDirectory ($entry.name + '.zip')
            git archive --format=zip --prefix=base-do-suporte/ --output=$zip $entry.revision
            if ($LASTEXITCODE -ne 0) { throw 'Could not create the source archive for scanning.' }
            $archiveHash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
            $start = [DateTime]::UtcNow
            Start-MpScan -ScanType CustomScan -ScanPath $zip -ErrorAction Stop
            $found = @(Get-MpThreatDetection -ErrorAction Stop | Where-Object { $_.InitialDetectionTime.ToUniversalTime() -ge $start.AddSeconds(-2) -and (@($_.Resources | Where-Object { $_ -like ('*'+$entry.name+'*') }).Count -gt 0) })
            $report.scans += @{ archive=$entry.name; revision=$entry.revision; sha256=$archiveHash; detectionCount=$found.Count; threatIds=@($found | ForEach-Object { $_.ThreatID }) }
        }
    }
} catch {
    $report.status = 'unavailable'
    $report.reason = $_.Exception.Message
} finally {
    $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'defender-report.json') -Encoding utf8
    Get-Content -LiteralPath (Join-Path $OutputDirectory 'defender-report.json')
}
if ($report.status -ne 'completed') { Write-Warning 'Defender verification was unavailable. This job does not certify the package as clean.' }
if (@($report.scans | Where-Object { $_.archive -eq 'revised-source' -and $_.detectionCount -gt 0 }).Count -gt 0) { throw 'Defender reported a detection in the revised source. Review defender-report.json; no allow-list action was taken.' }
