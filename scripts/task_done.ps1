param(
    [switch]$Headed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host "[task:done] Running typecheck..."
& npm.cmd run typecheck --prefix $repoRoot
if ($LASTEXITCODE -ne 0) {
    throw "[task:done] typecheck failed with exit code $LASTEXITCODE"
}

$smokeScript = if ($Headed) { "test:smoke:headed" } else { "test:smoke" }
Write-Host "[task:done] Running $smokeScript ..."
& npm.cmd run $smokeScript --prefix $repoRoot
if ($LASTEXITCODE -ne 0) {
    throw "[task:done] $smokeScript failed with exit code $LASTEXITCODE"
}

Write-Host "[task:done] PASS - task completion gate is green."
