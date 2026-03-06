import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SRC_DIR = path.join(ROOT, 'src');

const FORBIDDEN_PATTERNS = [
      {
            label: 'Legacy ZoneMonsterData import',
            regex: /from\s+['"][^'"]*ZoneMonsterData['"]/,
      },
      {
            label: 'Legacy MixMaster recipe JSON import',
            regex: /mixmaster_recipes\.json/,
      },
      {
            label: 'Legacy fusion payload import',
            regex: /fusion_payload/i,
      },
      {
            label: 'Direct scripts\\/gamedb runtime bypass import',
            regex: /from\s+['"][^'"]*scripts\/gamedb[^'"]*['"]/,
      },
      {
            label: 'Legacy runtime zone exact-map hardcode table',
            regex: /\bEXACT_ZONE_MAP\b/,
      },
      {
            label: 'Legacy runtime zone keyword hardcode table',
            regex: /\bKEYWORD_ZONE_MAP\b/,
      },
];

const FORBIDDEN_PATHS = [
      path.join(SRC_DIR, 'world', 'ZoneMonsterData.ts'),
];

async function walkTsFiles(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                  files.push(...(await walkTsFiles(full)));
                  continue;
            }
            if (entry.isFile() && full.endsWith('.ts')) files.push(full);
      }
      return files;
}

async function main() {
      const issues = [];

      for (const forbiddenPath of FORBIDDEN_PATHS) {
            try {
                  await fs.access(forbiddenPath);
                  issues.push({
                        type: 'forbidden-file',
                        message: `Forbidden legacy file exists: ${path.relative(ROOT, forbiddenPath)}`,
                  });
            } catch {
                  // Expected: file does not exist.
            }
      }

      const files = await walkTsFiles(SRC_DIR);
      for (const file of files) {
            const rel = path.relative(ROOT, file);
            const content = await fs.readFile(file, 'utf8');
            for (const check of FORBIDDEN_PATTERNS) {
                  if (!check.regex.test(content)) continue;
                  issues.push({
                        type: 'forbidden-pattern',
                        message: `${check.label} in ${rel}`,
                  });
            }
      }

      if (issues.length > 0) {
            console.error('[gamedb:check-legacy] FAILED');
            for (const issue of issues) {
                  console.error(`- ${issue.message}`);
            }
            process.exitCode = 1;
            return;
      }

      console.log('[gamedb:check-legacy] PASSED');
      console.log(`Checked ${files.length} TypeScript files under src/`);
}

main().catch((err) => {
      console.error('[gamedb:check-legacy] ERROR', err);
      process.exitCode = 1;
});
