param(
    [string]$MdbPath = $env:FUSION_MDB_PATH
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$mixJsonPath = Join-Path $repoRoot "src\data\fusion\mixmaster_recipes.json"

if ([string]::IsNullOrWhiteSpace($MdbPath) -and (Test-Path $mixJsonPath)) {
    try {
        $json = Get-Content $mixJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($json.meta -and $json.meta.mdbPath) {
            $MdbPath = [string]$json.meta.mdbPath
        }
    } catch {
        # Ignore parse failures and fall back to env input only.
    }
}

if ([string]::IsNullOrWhiteSpace($MdbPath)) {
    Write-Host "[fusion:export-mdb] Skip: no MDB path configured (set FUSION_MDB_PATH)."
    exit 0
}

if (-not (Test-Path $MdbPath)) {
    Write-Host "[fusion:export-mdb] Skip: MDB file not found -> $MdbPath"
    exit 0
}

Write-Host "[fusion:export-mdb] Source MDB: $MdbPath"
Write-Host "[fusion:export-mdb] Workspace keeps JSON as source-of-truth. No conversion step executed."
exit 0
