param(
    [string]$Url = "http://127.0.0.1:3000",
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
$pidFile = Join-Path $repoRoot "output\run-app.pid"
$devOutLog = Join-Path $repoRoot "output\run-app.out.log"
$devErrLog = Join-Path $repoRoot "output\run-app.err.log"

if (-not (Test-Path (Split-Path $pidFile))) {
    New-Item -ItemType Directory -Path (Split-Path $pidFile) -Force | Out-Null
}

if (Test-HttpUp -TargetUrl $Url) {
    Write-Output "APP_ALREADY_RUNNING"
    Write-Output "URL=$Url"
    exit 0
}

$devProc = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "3000") `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $devOutLog `
    -RedirectStandardError $devErrLog `
    -PassThru

Set-Content -Path $pidFile -Value $devProc.Id

if (-not (Wait-HttpUp -TargetUrl $Url -TimeoutSec $StartupTimeoutSec)) {
    throw "Dev server not reachable at $Url within ${StartupTimeoutSec}s. See $devErrLog"
}

Write-Output "APP_STARTED"
Write-Output "PID=$($devProc.Id)"
Write-Output "URL=$Url"
