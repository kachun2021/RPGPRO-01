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
$codeHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$webGameClient = Join-Path $codeHome "skills\develop-web-game\scripts\web_game_playwright_client.js"
$actionsRoot = Join-Path $PSScriptRoot "playwright-actions"
$outputRoot = Join-Path $repoRoot "output\web-game\task-smoke"
$headlessArg = if ($Headed) { "false" } else { "true" }

if (-not (Test-Path $webGameClient -PathType Leaf)) {
    throw "Missing web_game_playwright_client.js: $webGameClient"
}

$requiredActionFiles = @("idle.json", "move-and-idle.json")
foreach ($file in $requiredActionFiles) {
    $path = Join-Path $actionsRoot $file
    if (-not (Test-Path $path -PathType Leaf)) {
        throw "Missing action file: $path"
    }
}

if (-not (Test-Path $outputRoot)) {
    New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
}

$ignorableErrorPatterns = @(
    "fatal error occurred during WebGPU creation/initialization",
    "WebGPU is not supported",
    "Failed to load resource: net::ERR_CONNECTION_RESET",
    "Failed to load resource: net::ERR_CONNECTION_CLOSED"
)

function Run-Scenario {
    param(
        [string]$ScenarioName,
        [string]$ClickSelector,
        [string]$ActionsFileName,
        [string]$ExpectedPanelKey = "",
        [int]$MinAliveMonsters = -1,
        [string]$ExpectedAutoGrind = ""
    )

    $scenarioDir = Join-Path $outputRoot $ScenarioName
    if (Test-Path $scenarioDir) {
        Remove-Item -Path $scenarioDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $scenarioDir -Force | Out-Null

    $actionsPath = Join-Path $actionsRoot $ActionsFileName
    $args = @(
        $webGameClient,
        "--url", $Url,
        "--iterations", "1",
        "--pause-ms", "1400",
        "--headless", $headlessArg,
        "--screenshot-dir", $scenarioDir,
        "--actions-file", $actionsPath
    )
    if ($ClickSelector) {
        $args += @("--click-selector", $ClickSelector)
    }

    $maxAttempts = 2
    $ok = $false
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        & node @args
        if ($LASTEXITCODE -eq 0) {
            $ok = $true
            break
        }
        if ($attempt -lt $maxAttempts) {
            Write-Host "Scenario '$ScenarioName' transient failure, retrying ($attempt/$maxAttempts)..."
            Start-Sleep -Milliseconds 400
        }
    }
    if (-not $ok) {
        throw "Scenario '$ScenarioName' failed: Playwright client exited with code $LASTEXITCODE."
    }

    $shot = Join-Path $scenarioDir "shot-0.png"
    if (-not (Test-Path $shot -PathType Leaf)) {
        throw "Scenario '$ScenarioName' failed: missing screenshot $shot"
    }

    $errorFiles = @(Get-ChildItem -Path $scenarioDir -Filter "errors-*.json" -ErrorAction SilentlyContinue)
    if ($errorFiles.Count -gt 0) {
        $allErrors = @()
        foreach ($f in $errorFiles) {
            $json = Get-Content -Raw $f.FullName | ConvertFrom-Json
            if ($json) {
                $allErrors += @($json)
            }
        }

        $actionableErrors = @()
        foreach ($err in $allErrors) {
            $text = [string]$err.text
            $isIgnorable = $false
            foreach ($pattern in $ignorableErrorPatterns) {
                if ($text -match [regex]::Escape($pattern)) {
                    $isIgnorable = $true
                    break
                }
            }
            if (-not $isIgnorable) {
                $actionableErrors += $err
            }
        }

        if ($actionableErrors.Count -gt 0) {
            $first = [string]$actionableErrors[0].text
            throw "Scenario '$ScenarioName' failed: actionable console/page error detected: $first"
        }
    }

    $stateFile = Join-Path $scenarioDir "state-0.json"
    if (-not (Test-Path $stateFile -PathType Leaf)) {
        throw "Scenario '$ScenarioName' failed: state-0.json missing. Ensure window.render_game_to_text is exposed."
    }
    $state = Get-Content -Raw $stateFile | ConvertFrom-Json

    $panelPass = $true
    if (-not [string]::IsNullOrWhiteSpace($ExpectedPanelKey)) {
        $panelPass = [bool]$state.openPanels.$ExpectedPanelKey
        if (-not $panelPass) {
            throw "Scenario '$ScenarioName' failed: expected openPanels.$ExpectedPanelKey = true"
        }
    }

    if ($MinAliveMonsters -ge 0) {
        $alive = [int]$state.world.aliveMonsters
        if ($alive -lt $MinAliveMonsters) {
            throw "Scenario '$ScenarioName' failed: expected world.aliveMonsters >= $MinAliveMonsters (actual $alive)"
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($ExpectedAutoGrind)) {
        $autoActual = [bool]$state.world.autoGrind
        $autoExpected = [System.Convert]::ToBoolean($ExpectedAutoGrind)
        if ($autoActual -ne $autoExpected) {
            throw "Scenario '$ScenarioName' failed: expected world.autoGrind = $autoExpected (actual $autoActual)"
        }
    }

    return [pscustomobject]@{
        scenario = $ScenarioName
        screenshot = $shot
        state_ok = $panelPass
        alive_monsters = [int]$state.world.aliveMonsters
        auto_grind = [bool]$state.world.autoGrind
    }
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

    $scenarios = @(
        @{ name = "move-baseline"; click = "#renderCanvas"; actions = "move-and-idle.json"; panel = ""; minMon = 1; auto = "" },
        @{ name = "quest-panel"; click = "#nav-quest"; actions = "idle.json"; panel = "quest"; minMon = 0; auto = "" },
        @{ name = "inventory-panel"; click = "#nav-bag"; actions = "idle.json"; panel = "inventory"; minMon = 0; auto = "" },
        @{ name = "skill-panel"; click = "#nav-skill"; actions = "idle.json"; panel = "skill"; minMon = 0; auto = "" },
        @{ name = "system-panel"; click = "#nav-settings"; actions = "idle.json"; panel = "system"; minMon = 0; auto = "" },
        @{ name = "shop-panel"; click = "#nav-shop"; actions = "idle.json"; panel = "shop"; minMon = 0; auto = "" },
        @{ name = "map-panel"; click = "#nav-map"; actions = "idle.json"; panel = "map"; minMon = 0; auto = "" },
        @{ name = "pet-panel"; click = "#nav-pet"; actions = "idle.json"; panel = "pet"; minMon = 0; auto = "" },
        @{ name = "afk-panel"; click = "#auto-settings-btn"; actions = "idle.json"; panel = "afk"; minMon = 0; auto = "" },
        @{ name = "combat-auto"; click = "#auto-grind-btn"; actions = "idle.json"; panel = ""; minMon = 1; auto = "true" }
    )

    $results = @()
    foreach ($s in $scenarios) {
        Write-Host "Running scenario: $($s.name)"
        $result = Run-Scenario `
            -ScenarioName $s.name `
            -ClickSelector $s.click `
            -ActionsFileName $s.actions `
            -ExpectedPanelKey $s.panel `
            -MinAliveMonsters $s.minMon `
            -ExpectedAutoGrind $s.auto
        $results += $result
    }

    Write-Host ""
    Write-Host "Smoke test passed. Artifacts:"
    $results | Format-Table -AutoSize
} finally {
    if ($ownedDevServer -and $devProc -and -not $devProc.HasExited) {
        Stop-Process -Id $devProc.Id -Force
    }
}
