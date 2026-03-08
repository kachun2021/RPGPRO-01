param(
    [string]$Url = "http://127.0.0.1:3000",
    [switch]$Headed,
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
$outputRoot = Join-Path $repoRoot "output\web-game\task-smoke"
$runnerScript = Join-Path $repoRoot "scripts\task_smoke_runner.mjs"
$headlessArg = if ($Headed) { "false" } else { "true" }

if (-not (Test-Path $runnerScript -PathType Leaf)) {
    throw "Missing smoke runner: $runnerScript"
}

if (-not (Test-Path $outputRoot)) {
    New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
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

    & node $runnerScript --url $Url --output-dir $outputRoot --headless $headlessArg
    if ($LASTEXITCODE -ne 0) {
        throw "Smoke runner exited with code $LASTEXITCODE"
    }

    $summaryPath = Join-Path $outputRoot "summary.json"
    if (-not (Test-Path $summaryPath -PathType Leaf)) {
        throw "Smoke runner did not produce summary.json"
    }

    $results = Get-Content -Raw $summaryPath | ConvertFrom-Json
    Write-Host ""
    Write-Host "Smoke test passed. Artifacts:"
    $results | Format-Table -AutoSize
} finally {
    if ($ownedDevServer -and $devProc -and -not $devProc.HasExited) {
        Stop-Process -Id $devProc.Id -Force
    }
}
