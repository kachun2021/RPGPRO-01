import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const args = {
    url: 'http://127.0.0.1:3000',
    outputDir: '',
    headless: true,
    scenarios: [],
    groups: [],
    list: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--url' && next) {
      args.url = next;
      i += 1;
    } else if (arg === '--output-dir' && next) {
      args.outputDir = next;
      i += 1;
    } else if (arg === '--headless' && next) {
      args.headless = next !== '0' && next !== 'false';
      i += 1;
    } else if (arg === '--scenario' && next) {
      args.scenarios.push(...parseListArg(next));
      i += 1;
    } else if (arg === '--group' && next) {
      args.groups.push(...parseListArg(next));
      i += 1;
    } else if (arg === '--list') {
      args.list = true;
    }
  }

  if (!args.list && !args.outputDir) {
    throw new Error('--output-dir is required');
  }

  return args;
}

function parseListArg(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniqueInOrder(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resetDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function collectKnownGroups(scenarios) {
  return [...new Set(scenarios.flatMap((scenario) => scenario.groups || []))].sort();
}

function printScenarioCatalog(scenarios) {
  const groups = collectKnownGroups(scenarios);
  process.stdout.write('Available smoke groups:\n');
  for (const group of groups) {
    process.stdout.write(`- ${group}\n`);
  }

  process.stdout.write('\nAvailable smoke scenarios:\n');
  for (const scenario of scenarios) {
    const suffix = scenario.groups?.length ? ` [${scenario.groups.join(', ')}]` : '';
    process.stdout.write(`- ${scenario.name}${suffix}\n`);
  }
}

function selectScenarios(allScenarios, args) {
  const requestedScenarios = uniqueInOrder(args.scenarios);
  const requestedGroups = uniqueInOrder(args.groups);

  if (requestedScenarios.length === 0 && requestedGroups.length === 0) {
    return allScenarios.filter((scenario) => scenario.defaultEnabled !== false);
  }

  const knownScenarioNames = new Set(allScenarios.map((scenario) => scenario.name));
  const knownGroups = collectKnownGroups(allScenarios);
  const knownGroupNames = new Set(knownGroups);

  const unknownScenarios = requestedScenarios.filter((name) => !knownScenarioNames.has(name));
  if (unknownScenarios.length > 0) {
    throw new Error(`Unknown smoke scenario(s): ${unknownScenarios.join(', ')}`);
  }

  const unknownGroups = requestedGroups.filter((name) => !knownGroupNames.has(name));
  if (unknownGroups.length > 0) {
    throw new Error(`Unknown smoke group(s): ${unknownGroups.join(', ')}`);
  }

  const scenarioSet = new Set(requestedScenarios);
  const groupSet = new Set(requestedGroups);
  const selected = allScenarios.filter((scenario) => {
    if (scenarioSet.has(scenario.name)) return true;
    return (scenario.groups || []).some((group) => groupSet.has(group));
  });

  if (selected.length === 0) {
    throw new Error('No smoke scenarios matched the requested filters.');
  }

  return selected;
}

function resolvePlaywrightImport() {
  const codeHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const modulePath = path.join(codeHome, 'skills', 'develop-web-game', 'node_modules', 'playwright', 'index.mjs');
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Missing Playwright dependency at ${modulePath}`);
  }
  return pathToFileURL(modulePath).href;
}

function buildScenarioUrl(baseUrl, options = {}) {
  const next = new URL(baseUrl);
  if (options.autotest === false) {
    next.searchParams.delete('autotest');
  } else {
    next.searchParams.set('autotest', '1');
  }

  for (const [key, value] of Object.entries(options.params || {})) {
    if (value === null || value === undefined || value === false) {
      next.searchParams.delete(key);
      continue;
    }
    next.searchParams.set(key, String(value));
  }

  return next.toString();
}

function createErrorCollector() {
  const errors = [];
  return {
    errors,
    add(error) {
      errors.push(error);
    },
  };
}

async function safeState(page) {
  try {
    const raw = await page.evaluate(() => {
      if (typeof window.render_game_to_text === 'function') {
        return window.render_game_to_text();
      }
      return null;
    });
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function waitForState(page, predicate, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  let lastState = null;
  while (Date.now() < deadline) {
    lastState = await safeState(page);
    if (lastState && predicate(lastState)) {
      return lastState;
    }
    await page.waitForTimeout(200);
  }
  const suffix = lastState ? ` Last state: ${JSON.stringify(lastState)}` : '';
  throw new Error(`${label} timed out after ${timeoutMs}ms.${suffix}`);
}

async function waitForRenderReady(page, timeoutMs = 20000) {
  return waitForState(page, (state) => state.mode === 'play', timeoutMs, 'render_game_to_text readiness');
}

async function clickDom(page, selector) {
  await page.evaluate((targetSelector) => {
    const target = document.querySelector(targetSelector);
    if (!(target instanceof HTMLElement)) {
      throw new Error(`Missing element: ${targetSelector}`);
    }
    target.click();
  }, selector);
}

async function openHudMenu(page) {
  const visible = await page.evaluate(() => {
    const panel = document.querySelector('.hud-menu-panel');
    if (!(panel instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(panel);
    return style.opacity !== '0' && style.visibility !== 'hidden' && style.pointerEvents !== 'none';
  });
  if (visible) return;
  await clickDom(page, '#nav-menu');
  await page.waitForTimeout(180);
}

function actionableErrors(collectedErrors) {
  const ignorablePatterns = [
    'fatal error occurred during WebGPU creation/initialization',
    'WebGPU is not supported',
    'Failed to load resource: net::ERR_CONNECTION_RESET',
    'Failed to load resource: net::ERR_CONNECTION_CLOSED',
  ];
  return collectedErrors.filter((entry) => !ignorablePatterns.some((pattern) => entry.text.includes(pattern)));
}

function assertScenarioState(name, state, expect = {}) {
  const fail = (message) => {
    throw new Error(`Scenario '${name}' failed: ${message}`);
  };

  if (!state || typeof state !== 'object') fail('state missing');
  if (!state.mode) fail('state.mode missing');
  if (!state.zone?.id) fail('state.zone.id missing');
  if (!state.zone?.sceneZoneId) fail('state.zone.sceneZoneId missing');
  if (!Array.isArray(state.zone?.runtimeZoneIds) || state.zone.runtimeZoneIds.length <= 0) fail('state.zone.runtimeZoneIds missing');
  if (!state.identity?.playerName) fail('state.identity.playerName missing');
  if (state.player?.playerDead === undefined) fail('state.player.playerDead missing');
  if (!Array.isArray(state.modalStack)) fail('state.modalStack missing');
  if (!state.settingsApplied) fail('state.settingsApplied missing');
  if (!state.viewport?.orientation) fail('state.viewport.orientation missing');
  if (state.pets?.deadCount === undefined) fail('state.pets.deadCount missing');
  if (!state.quests) fail('state.quests missing');
  if (!state.uiChromeState) fail('state.uiChromeState missing');
  if (!state.guidanceSource) fail('state.guidanceSource missing');
  if (typeof state.guidanceText !== 'string') fail('state.guidanceText missing');
  if (!state.primaryNavMode) fail('state.primaryNavMode missing');

  for (const key of ['joystickSensitivity', 'cameraSensitivity', 'invertCameraY', 'autoLockTarget']) {
    if (state.settingsApplied[key] === undefined) {
      fail(`state.settingsApplied.${key} missing`);
    }
  }

  if (expect.currentPanel !== undefined) {
    const actual = state.currentPanel ?? null;
    if (actual !== expect.currentPanel) {
      fail(`expected currentPanel=${expect.currentPanel}, actual=${actual}`);
    }
  }

  if (expect.sceneZoneId && state.zone.sceneZoneId !== expect.sceneZoneId) {
    fail(`expected zone.sceneZoneId=${expect.sceneZoneId}, actual=${state.zone.sceneZoneId}`);
  }

  if (Array.isArray(expect.runtimeZoneIds)) {
    for (const runtimeZoneId of expect.runtimeZoneIds) {
      if (!state.zone.runtimeZoneIds.includes(runtimeZoneId)) {
        fail(`expected runtimeZoneIds to contain ${runtimeZoneId}`);
      }
    }
  }

  if (expect.playerDead !== undefined && state.player.playerDead !== expect.playerDead) {
    fail(`expected player.playerDead=${expect.playerDead}, actual=${state.player.playerDead}`);
  }

  if (expect.openPanel) {
    if (!state.openPanels?.[expect.openPanel]) {
      fail(`expected openPanels.${expect.openPanel}=true`);
    }
  }

  if (expect.modalIncludes) {
    const modalIds = Array.isArray(expect.modalIncludes) ? expect.modalIncludes : [expect.modalIncludes];
    for (const modalId of modalIds) {
      if (!state.modalStack.includes(modalId)) {
        fail(`expected modalStack to include ${modalId}`);
      }
    }
  }

  if (expect.orientation && state.viewport.orientation !== expect.orientation) {
    fail(`expected viewport.orientation=${expect.orientation}, actual=${state.viewport.orientation}`);
  }

  if (expect.autoGrind !== undefined && state.world.autoGrind !== expect.autoGrind) {
    fail(`expected world.autoGrind=${expect.autoGrind}, actual=${state.world.autoGrind}`);
  }

  if (expect.deadPetCount !== undefined && state.pets.deadCount !== expect.deadPetCount) {
    fail(`expected pets.deadCount=${expect.deadPetCount}, actual=${state.pets.deadCount}`);
  }

  if (expect.goldLessThan !== undefined && !(state.player.gold < expect.goldLessThan)) {
    fail(`expected player.gold < ${expect.goldLessThan}, actual=${state.player.gold}`);
  }

  if (expect.minInvulnerabilitySec !== undefined && !(state.player.invulnerabilitySec >= expect.minInvulnerabilitySec)) {
    fail(`expected player.invulnerabilitySec >= ${expect.minInvulnerabilitySec}, actual=${state.player.invulnerabilitySec}`);
  }

  if (expect.starterMainStatus !== undefined && state.quests.starterMainStatus !== expect.starterMainStatus) {
    fail(`expected quests.starterMainStatus=${expect.starterMainStatus}, actual=${state.quests.starterMainStatus}`);
  }

  if (expect.reportableCount !== undefined && state.quests.reportableCount !== expect.reportableCount) {
    fail(`expected quests.reportableCount=${expect.reportableCount}, actual=${state.quests.reportableCount}`);
  }

  if (expect.uiChromeState !== undefined && state.uiChromeState !== expect.uiChromeState) {
    fail(`expected uiChromeState=${expect.uiChromeState}, actual=${state.uiChromeState}`);
  }

  if (expect.guidanceSource !== undefined && state.guidanceSource !== expect.guidanceSource) {
    fail(`expected guidanceSource=${expect.guidanceSource}, actual=${state.guidanceSource}`);
  }

  if (expect.guidanceTextIncludes && !String(state.guidanceText || '').includes(expect.guidanceTextIncludes)) {
    fail(`expected guidanceText to include '${expect.guidanceTextIncludes}', actual='${state.guidanceText}'`);
  }

  if (expect.primaryNavMode !== undefined && state.primaryNavMode !== expect.primaryNavMode) {
    fail(`expected primaryNavMode=${expect.primaryNavMode}, actual=${state.primaryNavMode}`);
  }
}

async function assertDomExpectations(page, name, expect = {}) {
  const fail = (message) => {
    throw new Error(`Scenario '${name}' failed: ${message}`);
  };

  const missingSelectors = Array.isArray(expect.missingSelector) ? expect.missingSelector : expect.missingSelector ? [expect.missingSelector] : [];
  for (const selector of missingSelectors) {
    const present = await page.evaluate((targetSelector) => !!document.querySelector(targetSelector), selector);
    if (present) fail(`expected selector '${selector}' to be absent`);
  }

  const visibleSelectors = Array.isArray(expect.visibleSelector) ? expect.visibleSelector : expect.visibleSelector ? [expect.visibleSelector] : [];
  for (const selector of visibleSelectors) {
    const visible = await page.evaluate((targetSelector) => {
      const el = document.querySelector(targetSelector);
      if (!(el instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(el);
      return !el.hidden && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }, selector);
    if (!visible) fail(`expected selector '${selector}' to be visible`);
  }
}

async function captureArtifacts(page, scenarioDir, state, collectedErrors) {
  await page.screenshot({
    path: path.join(scenarioDir, 'shot-0.png'),
    fullPage: false,
  });
  if (state) {
    fs.writeFileSync(path.join(scenarioDir, 'state-0.json'), JSON.stringify(state, null, 2));
  }
  if (collectedErrors.length > 0) {
    fs.writeFileSync(path.join(scenarioDir, 'errors-0.json'), JSON.stringify(collectedErrors, null, 2));
  }
}

async function runScenario(browser, baseUrl, outputDir, scenario) {
  const scenarioDir = path.join(outputDir, scenario.name);
  resetDir(scenarioDir);

  const viewport = scenario.viewport || { width: 1280, height: 720 };
  const context = await browser.newContext({
    viewport,
  });
  if (scenario.initScript) {
    await context.addInitScript(scenario.initScript);
  }
  const page = await context.newPage();
  const errorCollector = createErrorCollector();

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    errorCollector.add({ type: 'console.error', text: msg.text() });
  });
  page.on('pageerror', (error) => {
    errorCollector.add({ type: 'pageerror', text: String(error) });
  });

  let finalState = null;
  try {
    const targetUrl = buildScenarioUrl(baseUrl, {
      autotest: scenario.autotest,
      params: scenario.params,
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    if (scenario.beforeReady) {
      await scenario.beforeReady(page);
    }

    await waitForRenderReady(page, scenario.readyTimeoutMs || 20000);

    if (scenario.prepare) {
      await scenario.prepare(page);
    }

    if (scenario.clickSelector) {
      await page.waitForSelector(scenario.clickSelector, { state: 'visible', timeout: 10000 });
      await clickDom(page, scenario.clickSelector);
      await page.waitForTimeout(250);
    }

    if (scenario.afterClickWaitFor) {
      await waitForState(page, scenario.afterClickWaitFor, scenario.afterClickTimeoutMs || 10000, `${scenario.name} post-click state`);
    }

    await page.waitForTimeout(scenario.pauseMs || 800);
    finalState = await safeState(page);
    await captureArtifacts(page, scenarioDir, finalState, errorCollector.errors);

    const errors = actionableErrors(errorCollector.errors);
    if (errors.length > 0) {
      throw new Error(`actionable console/page error detected: ${errors[0].text}`);
    }

    await assertDomExpectations(page, scenario.name, scenario.expect);
    assertScenarioState(scenario.name, finalState, scenario.expect);

    return {
      scenario: scenario.name,
      groups: (scenario.groups || []).join(','),
      viewport: `${viewport.width}x${viewport.height}`,
      screenshot: path.join(scenarioDir, 'shot-0.png'),
      current_panel: finalState.currentPanel ?? '',
      scene_zone_id: finalState.zone.sceneZoneId,
      runtime_zone_ids: finalState.zone.runtimeZoneIds.join(','),
      player_name: finalState.identity.playerName,
      player_dead: finalState.player.playerDead,
      dead_pets: finalState.pets.deadCount,
      auto_grind: finalState.world.autoGrind,
    };
  } catch (error) {
    finalState = finalState || await safeState(page);
    await captureArtifacts(page, scenarioDir, finalState, errorCollector.errors);
    throw error;
  } finally {
    await context.close();
  }
}

const LANDSCAPE_GRID_VIEWPORTS = [
  { key: '844x390', width: 844, height: 390 },
  { key: '932x430', width: 932, height: 430 },
  { key: '1024x576', width: 1024, height: 576 },
  { key: '1280x720', width: 1280, height: 720 },
];

function createLandscapeVariant(baseScenario, viewportDef, namePrefix = baseScenario.name) {
  return {
    ...baseScenario,
    name: `${namePrefix}-${viewportDef.key}`,
    viewport: { width: viewportDef.width, height: viewportDef.height },
    groups: uniqueInOrder([...(baseScenario.groups || []), 'landscape-grid']),
    expect: {
      ...(baseScenario.expect || {}),
      orientation: 'landscape',
    },
    defaultEnabled: false,
  };
}

function createScenarios() {
  const baseScenarios = [
    {
      name: 'hero-create-bootstrap',
      groups: ['bootstrap', 'core', 'mobile'],
      autotest: false,
      params: { manualtest: '1', heroCreate: '1' },
      beforeReady: async (page) => {
        await page.waitForSelector('#hero-create-confirm', { state: 'visible', timeout: 15000 });
        await clickDom(page, '#hero-create-confirm');
        await page.waitForTimeout(250);
      },
      expect: {
        currentPanel: null,
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        orientation: 'landscape',
      },
    },
    {
      name: 'move-baseline',
      groups: ['baseline', 'core', 'world', 'mobile'],
      expect: {
        currentPanel: null,
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'explore',
        guidanceSource: 'onboarding',
        primaryNavMode: 'primary',
        missingSelector: '#nav-community',
        visibleSelector: ['.guidance-root', '#nav-quest', '#nav-menu', '.hud-quick-dock', '.minimap-root', '#auto-settings-btn'],
      },
    },
    {
      name: 'misty-forest-baseline',
      groups: ['baseline', 'core', 'world', 'combat'],
      prepare: async (page) => {
        await page.evaluate(async () => {
          await window.__fpoDebug?.travelToZone?.('misty_forest');
        });
      },
      afterClickWaitFor: (state) => state.zone.sceneZoneId === 'misty_forest',
      afterClickTimeoutMs: 15000,
      expect: {
        currentPanel: null,
        sceneZoneId: 'misty_forest',
        playerDead: false,
        uiChromeState: 'explore',
        primaryNavMode: 'primary',
        visibleSelector: '.guidance-root',
      },
    },
    {
      name: 'quest-panel',
      groups: ['ui', 'panel', 'quest'],
      clickSelector: '#nav-quest',
      expect: {
        currentPanel: 'quest',
        openPanel: 'quest',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
      },
    },
    {
      name: 'inventory-panel',
      groups: ['ui', 'panel'],
      clickSelector: '#nav-bag',
      expect: {
        currentPanel: 'bag',
        openPanel: 'bag',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
      },
    },
    {
      name: 'skill-panel',
      groups: ['ui', 'panel'],
      prepare: async (page) => {
        await openHudMenu(page);
      },
      clickSelector: '#nav-skill',
      expect: {
        currentPanel: 'skill',
        openPanel: 'skill',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
      },
    },
    {
      name: 'system-panel',
      groups: ['ui', 'panel'],
      prepare: async (page) => {
        await openHudMenu(page);
      },
      clickSelector: '#nav-settings',
      expect: {
        currentPanel: 'settings',
        openPanel: 'settings',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
      },
    },
    {
      name: 'character-panel',
      groups: ['ui', 'panel'],
      prepare: async (page) => {
        await openHudMenu(page);
      },
      clickSelector: '#nav-char',
      expect: {
        currentPanel: 'char',
        openPanel: 'char',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
      },
    },
    {
      name: 'community-preview-panel',
      groups: ['ui', 'panel'],
      prepare: async (page) => {
        await page.evaluate(() => window.__fpoDebug?.openCommunityPanel?.());
      },
      afterClickWaitFor: (state) => state.currentPanel === 'community' && state.openPanels.community === true,
      expect: {
        currentPanel: 'community',
        openPanel: 'community',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
        missingSelector: '#nav-community',
      },
    },
    {
      name: 'book-panel',
      groups: ['ui', 'panel'],
      prepare: async (page) => {
        await openHudMenu(page);
      },
      clickSelector: '#nav-book',
      afterClickWaitFor: (state) => state.currentPanel === 'book' && state.openPanels.book === true,
      afterClickTimeoutMs: 15000,
      expect: {
        currentPanel: 'book',
        openPanel: 'book',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
        visibleSelector: ['#encyclopediaPanel', '.book-filter-row', '.book-detail-pane'],
      },
    },
    {
      name: 'shop-panel',
      groups: ['ui', 'panel'],
      prepare: async (page) => {
        await openHudMenu(page);
      },
      clickSelector: '#nav-shop',
      afterClickWaitFor: (state) => state.currentPanel === 'shop' && state.openPanels.shop === true,
      afterClickTimeoutMs: 15000,
      expect: {
        currentPanel: 'shop',
        openPanel: 'shop',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
      },
    },
    {
      name: 'dialogue-panel',
      groups: ['ui', 'modal', 'quest'],
      prepare: async (page) => {
        await page.evaluate(() => window.__fpoDebug?.openNpcDialogue?.('npc_quest_01'));
      },
      afterClickWaitFor: (state) => state.openPanels.dialogue === true,
      expect: {
        currentPanel: null,
        openPanel: 'dialogue',
        modalIncludes: 'dialogue',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'dialogue_focus',
        primaryNavMode: 'suppressed',
        visibleSelector: ['#dialogue-panel', '.dlg-action-primary'],
      },
    },
    {
      name: 'fusion-panel',
      groups: ['ui', 'panel'],
      prepare: async (page) => {
        await page.evaluate(() => window.__fpoDebug?.openFusionPanel?.());
      },
      afterClickWaitFor: (state) => state.currentPanel === 'fusion' && state.openPanels.fusion === true,
      afterClickTimeoutMs: 15000,
      expect: {
        currentPanel: 'fusion',
        openPanel: 'fusion',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
        visibleSelector: ['#fusionPanel', '.fpo-tabs-row', '.fpo-bottom-bar'],
      },
    },
    {
      name: 'map-panel-landscape',
      groups: ['ui', 'panel', 'world', 'mobile'],
      viewport: { width: 844, height: 390 },
      clickSelector: '#nav-map',
      afterClickWaitFor: (state) => state.currentPanel === 'map' && state.openPanels.map === true,
      afterClickTimeoutMs: 15000,
      expect: {
        currentPanel: 'map',
        openPanel: 'map',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        orientation: 'landscape',
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
        visibleSelector: ['#world-map-panel', '.wmp-body'],
      },
    },
    {
      name: 'pet-panel',
      groups: ['ui', 'panel'],
      clickSelector: '#nav-pet',
      expect: {
        currentPanel: 'pet',
        openPanel: 'pet',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
        visibleSelector: ['#petPanel', '.pet-panel-body', '.pet-hero-card'],
      },
    },
    {
      name: 'afk-panel',
      groups: ['ui', 'panel', 'mobile', 'combat'],
      clickSelector: '#auto-settings-btn',
      expect: {
        currentPanel: 'afk',
        openPanel: 'afk',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
        visibleSelector: ['#afk-panel', '.afk-headline', '.afk-layout'],
      },
    },
    {
      name: 'combat-auto',
      groups: ['combat', 'mobile'],
      clickSelector: '#auto-grind-btn',
      afterClickWaitFor: (state) => state.world.autoGrind === true,
      expect: {
        currentPanel: null,
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        autoGrind: true,
        uiChromeState: 'combat',
        primaryNavMode: 'primary',
      },
    },
    {
      name: 'resonance-panel',
      groups: ['ui', 'panel', 'combat'],
      prepare: async (page) => {
        await page.evaluate(() => window.__fpoDebug?.openResonancePanel?.());
      },
      afterClickWaitFor: (state) => state.currentPanel === 'resonance' && state.openPanels.resonance === true,
      expect: {
        currentPanel: 'resonance',
        openPanel: 'resonance',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        uiChromeState: 'panel_focus',
        primaryNavMode: 'suppressed',
      },
    },
    {
      name: 'player-death-revive',
      groups: ['combat', 'modal'],
      prepare: async (page) => {
        await page.evaluate(() => window.__fpoDebug?.damagePlayer?.(999, 'smoke'));
        await page.waitForSelector('#player-death-overlay [data-action="field"]', { state: 'visible', timeout: 10000 });
        await clickDom(page, '#player-death-overlay [data-action="field"]');
      },
      afterClickWaitFor: (state) => state.player.playerDead === false && state.player.invulnerabilitySec >= 1,
      expect: {
        currentPanel: null,
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        minInvulnerabilitySec: 1,
      },
    },
    {
      name: 'pet-revival',
      groups: ['combat', 'modal'],
      prepare: async (page) => {
        await page.evaluate(() => {
          window.__fpoDebug?.killPet?.(0);
          window.__fpoDebug?.openRevivalPanel?.();
        });
        await waitForState(page, (state) => state.openPanels.revival === true && state.pets.deadCount > 0, 8000, 'pet revival modal');
        await clickDom(page, '.revival-row-btn');
      },
      afterClickWaitFor: (state) => state.pets.deadCount === 0,
      expect: {
        currentPanel: null,
        modalIncludes: 'revival',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        deadPetCount: 0,
        goldLessThan: 240,
      },
    },
    {
      name: 'npc-report-loop',
      groups: ['quest', 'modal'],
      prepare: async (page) => {
        const questId = await page.evaluate(() => window.__fpoDebug?.prepareQuestTurnIn?.('npc_quest_01'));
        if (!questId) {
          throw new Error('prepareQuestTurnIn did not return a quest id');
        }
        await page.evaluate(() => window.__fpoDebug?.openNpcDialogue?.('npc_quest_01'));
        await page.waitForSelector('#dialogue-panel [data-action="report"]', { state: 'visible', timeout: 8000 });
        await clickDom(page, '#dialogue-panel [data-action="report"]');
      },
      afterClickWaitFor: (state) => state.currentPanel === 'quest' && state.quests.starterMainStatus === 'claimed',
      expect: {
        currentPanel: 'quest',
        openPanel: 'quest',
        sceneZoneId: 'starter_meadow',
        runtimeZoneIds: [130],
        playerDead: false,
        starterMainStatus: 'claimed',
        reportableCount: 0,
      },
    },
  ];

  const gridTargets = [
    { scenario: baseScenarios.find((item) => item.name === 'move-baseline'), namePrefix: 'move-baseline' },
    { scenario: baseScenarios.find((item) => item.name === 'dialogue-panel'), namePrefix: 'dialogue-panel' },
    { scenario: baseScenarios.find((item) => item.name === 'fusion-panel'), namePrefix: 'fusion-panel' },
    { scenario: baseScenarios.find((item) => item.name === 'book-panel'), namePrefix: 'book-panel' },
    { scenario: baseScenarios.find((item) => item.name === 'afk-panel'), namePrefix: 'afk-panel' },
    { scenario: baseScenarios.find((item) => item.name === 'map-panel-landscape'), namePrefix: 'map-panel' },
  ].filter((entry) => entry.scenario);

  const landscapeGridScenarios = gridTargets.flatMap(({ scenario, namePrefix }) =>
    LANDSCAPE_GRID_VIEWPORTS.map((viewportDef) => createLandscapeVariant(scenario, viewportDef, namePrefix)),
  );

  return [...baseScenarios, ...landscapeGridScenarios];
}

async function main() {
  const args = parseArgs(process.argv);
  const allScenarios = createScenarios();

  if (args.list) {
    printScenarioCatalog(allScenarios);
    return;
  }

  const scenarios = selectScenarios(allScenarios, args);
  resetDir(args.outputDir);

  const playwrightImport = resolvePlaywrightImport();
  const { chromium } = await import(playwrightImport);
  const browser = await chromium.launch({
    headless: args.headless,
    args: ['--use-gl=angle', '--use-angle=swiftshader'],
  });

  const results = [];
  try {
    process.stdout.write(`Running ${scenarios.length}/${allScenarios.length} smoke scenarios\n`);
    for (const scenario of scenarios) {
      process.stdout.write(`Running scenario: ${scenario.name}\n`);
      const result = await runScenario(browser, args.url, args.outputDir, scenario);
      results.push(result);
    }
  } finally {
    await browser.close();
  }

  const summaryPath = path.join(args.outputDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  process.stdout.write(`Smoke test passed. Summary: ${summaryPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
