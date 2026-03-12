param(
    [string]$Url = "http://127.0.0.1:3000/?autotest=1",
    [string]$OutputDir = "",
    [int]$StartupTimeoutSec = 90
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-HttpUp {
    param([string]$TargetUrl)
    try {
        Invoke-WebRequest -Uri $TargetUrl -Method Head -UseBasicParsing -TimeoutSec 2 | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Wait-HttpUp {
    param(
        [string]$TargetUrl,
        [int]$TimeoutSec
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-HttpUp -TargetUrl $TargetUrl) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$auditScript = Join-Path $repoRoot "scripts\ui_panel_audit.py"
$resolvedOutputDir = if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    Join-Path $repoRoot "output\ui-audit-step-25"
} else {
    $OutputDir
}

if (-not (Test-Path $auditScript -PathType Leaf)) {
    throw "Missing audit script: $auditScript"
}

if (-not (Test-Path $resolvedOutputDir)) {
    New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null
}

$ownedDevServer = $false
$devProc = $null
$devOutLog = Join-Path $repoRoot "dev.out.log"
$devErrLog = Join-Path $repoRoot "dev.err.log"

try {
    if (-not (Test-HttpUp -TargetUrl $Url)) {
        $devProc = Start-Process `
            -FilePath "npm.cmd" `
            -ArgumentList @("run", "dev") `
            -WorkingDirectory $repoRoot `
            -RedirectStandardOutput $devOutLog `
            -RedirectStandardError $devErrLog `
            -PassThru

        $ownedDevServer = $true
        if (-not (Wait-HttpUp -TargetUrl $Url -TimeoutSec $StartupTimeoutSec)) {
            throw "Dev server not reachable at $Url within ${StartupTimeoutSec}s. See $devErrLog"
        }
    }

    & python $auditScript --url $Url --output-dir $resolvedOutputDir
    if ($LASTEXITCODE -ne 0) {
        throw "UI panel audit exited with code $LASTEXITCODE"
    }
} finally {
    if ($ownedDevServer -and $devProc -and -not $devProc.HasExited) {
        Stop-Process -Id $devProc.Id -Force
    }
}
