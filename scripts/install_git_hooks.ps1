Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

git config core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) {
    throw "Failed to set git core.hooksPath"
}

$hookPath = Join-Path $repoRoot ".githooks\pre-push"
if (-not (Test-Path $hookPath -PathType Leaf)) {
    throw "Missing hook file: $hookPath"
}

Write-Host "Installed hooks path: .githooks"
Write-Host "Active pre-push hook: $hookPath"
