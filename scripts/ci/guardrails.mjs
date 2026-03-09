import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SRC_DIR = path.join(ROOT, 'src');
const INLINE_STYLE_LIMIT = 95;

async function readFileUtf8(relPath) {
      return fs.readFile(path.join(ROOT, relPath), 'utf8');
}

async function walkFiles(dir, exts) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                  files.push(...(await walkFiles(full, exts)));
                  continue;
            }
            if (entry.isFile() && exts.some((ext) => full.endsWith(ext))) files.push(full);
      }
      return files;
}

function regexAll(text, regex) {
      return Array.from(text.matchAll(regex));
}

async function main() {
      const issues = [];
      const notes = [];

      const sceneZoneProfiles = await readFileUtf8('src/world/SceneZoneProfiles.ts');
      const questManager = await readFileUtf8('src/systems/QuestManager.ts');
      const npc = await readFileUtf8('src/entities/NPC.ts');
      const zoneManager = await readFileUtf8('src/world/ZoneManager.ts');
      const mainTs = await readFileUtf8('src/main.ts');
      const indexHtml = await readFileUtf8('index.html');
      const hudTs = await readFileUtf8('src/ui/HUD.ts');
      const communityPanelTs = await readFileUtf8('src/ui/CommunityPanel.ts');

      const sceneZoneIds = new Set(
            regexAll(sceneZoneProfiles, /id:\s*'([a-z0-9_]+)'/g).map((m) => m[1]),
      );
      const unlockIds = regexAll(questManager, /\b\d+:\s*'([a-z0-9_]+)'/g).map((m) => m[1]);
      const invalidUnlockIds = unlockIds.filter((id) => !sceneZoneIds.has(id));
      if (invalidUnlockIds.length > 0) {
            issues.push(`Quest unlock zone IDs not found in scene profiles: ${invalidUnlockIds.join(', ')}`);
      } else {
            notes.push(`Quest unlock IDs valid (${unlockIds.length})`);
      }

      if (/localStorage\.clear\s*\(/.test(mainTs)) {
            issues.push('Forbidden reset pattern found: localStorage.clear(...) in src/main.ts');
      } else {
            notes.push('No localStorage.clear in src/main.ts');
      }

      if (!npc.includes('private _pointerObserver')) {
            issues.push('NPCManager missing _pointerObserver lifecycle field');
      }
      if (!/despawnAll\(\):\s*void\s*\{[\s\S]*_detachPointerObserver\(\)/.test(npc)) {
            issues.push('NPCManager.despawnAll() must detach pointer observer');
      }
      if (!/dispose\(\):\s*void\s*\{[\s\S]*_detachPointerObserver\(\)/.test(npc)) {
            issues.push('NPCManager.dispose() must detach pointer observer');
      }

      if (/for\s*\(\s*const\s+zone\s+of\s+listRuntimeSceneZones\(\)\s*\)\s*this\._unlockedZones\.add\(zone\.id\)/.test(zoneManager)) {
            issues.push('ZoneManager fallback still contains unlock-all logic');
      } else {
            notes.push('ZoneManager unlock-all fallback not detected');
      }

      if (!/#ui-layer\s+\[hidden\]/.test(indexHtml)) {
            issues.push('index.html missing #ui-layer [hidden] safety rule');
      } else {
            notes.push('Hidden panel CSS safety rule present');
      }

      const requiredLazyImports = [
            "import('./ui/FusionPanel')",
            "import('./ui/EncyclopediaPanel')",
            "import('./ui/WorldMapPanel')",
            "import('./ui/ShopPanel')",
      ];
      for (const token of requiredLazyImports) {
            if (!mainTs.includes(token)) {
                  issues.push(`Missing lazy-load token in main.ts: ${token}`);
            }
      }

      const tsFiles = await walkFiles(SRC_DIR, ['.ts']);
      const styleFiles = await walkFiles(path.join(SRC_DIR, 'ui'), ['.ts']);
      styleFiles.push(...(await walkFiles(path.join(SRC_DIR, 'world'), ['.ts'])));
      styleFiles.push(...(await walkFiles(path.join(SRC_DIR, 'systems'), ['.ts'])));
      let styleCount = 0;
      for (const file of styleFiles) {
            const text = await fs.readFile(file, 'utf8');
            styleCount += regexAll(text, /\bstyle\./g).length;
      }
      notes.push(`Inline style usage count: ${styleCount} (limit=${INLINE_STYLE_LIMIT})`);
      if (styleCount > INLINE_STYLE_LIMIT) {
            issues.push(`Inline style usage exceeded guardrail: ${styleCount} > ${INLINE_STYLE_LIMIT}`);
      }

      const storageAdapterPath = 'src/services/adapters/local/LocalStorageKV.ts';
      const approvedRouteFiles = new Set([
            'src/data/runtime/RuntimeZoneBridge.ts',
            'src/data/runtime/RuntimeSceneRouteApi.ts',
      ]);
      const legacyMapFields = ['trackedTargetMapName', 'selectedMapName', 'focusedMapName', 'lastMapName'];

      for (const file of tsFiles) {
            const relPath = path.relative(ROOT, file).replace(/\\/g, '/');
            const text = await fs.readFile(file, 'utf8');

            if (
                  relPath !== storageAdapterPath
                  && /(?:window\.)?(?:localStorage|sessionStorage)\s*\.(?:getItem|setItem|removeItem|clear|key|length)\b/.test(text)
            ) {
                  issues.push(`Direct browser storage access outside adapter: ${relPath}`);
            }

            if (!approvedRouteFiles.has(relPath) && /matchRuntimeZoneToSceneZone\s*\(/.test(text)) {
                  issues.push(`Direct runtime-zone heuristic access outside route API: ${relPath}`);
            }

            if (relPath.startsWith('src/ui/') && /panelId\s*=|readonly\s+panelId/.test(text) && /style\.display\s*=/.test(text)) {
                  issues.push(`Panel visibility must not use style.display in ${relPath}`);
            }

            for (const field of legacyMapFields) {
                  if (text.includes(field)) {
                        issues.push(`Legacy map-name tracking field detected (${field}) in ${relPath}`);
                  }
            }
      }

      if (hudTs.includes('nav-community')) {
            issues.push('Primary navigation must not include nav-community');
      } else {
            notes.push('Primary navigation excludes community preview');
      }

      if (/\bMOCK_[A-Z0-9_]+\b/.test(communityPanelTs) || /\bSOCIAL_FEATURES_LIVE\b/.test(communityPanelTs)) {
            issues.push('CommunityPanel still contains mock/live feature flags');
      } else {
            notes.push('CommunityPanel mock/live flags not detected');
      }

      if (issues.length > 0) {
            console.error('[ci:guardrails] FAILED');
            for (const issue of issues) console.error(`- ${issue}`);
            if (notes.length > 0) {
                  console.error('[ci:guardrails] Notes:');
                  for (const note of notes) console.error(`  • ${note}`);
            }
            process.exitCode = 1;
            return;
      }

      console.log('[ci:guardrails] PASSED');
      for (const note of notes) console.log(`- ${note}`);
}

main().catch((err) => {
      console.error('[ci:guardrails] ERROR', err);
      process.exitCode = 1;
});
