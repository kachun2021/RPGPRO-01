param(
    [switch]$Headed,
    [switch]$WithSmoke,
    [ValidateSet('quick', 'core', 'ui', 'landscape', 'full')]
    [string]$SmokeProfile = 'quick'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host "[task:done] Running build (includes typecheck)..."
& npm.cmd run build --prefix $repoRoot
if ($LASTEXITCODE -ne 0) {
    throw "[task:done] build failed with exit code $LASTEXITCODE"
}

if ($WithSmoke) {
    $smokeArgs = @(
        "-ExecutionPolicy", "Bypass",
        "-File", (Join-Path $repoRoot "scripts\task_smoke.ps1"),
        "-Profile", $SmokeProfile
    )
    if ($Headed) {
        $smokeArgs += "-Headed"
    }

    Write-Host "[task:done] Running smoke profile '$SmokeProfile' ..."
    & pwsh @smokeArgs
    if ($LASTEXITCODE -ne 0) {
        throw "[task:done] smoke profile '$SmokeProfile' failed with exit code $LASTEXITCODE"
    }
}

Write-Host "[task:done] PASS - task completion gate is green."
