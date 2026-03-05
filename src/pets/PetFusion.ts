import { PET_DEFS } from './PetData';
import type { PetDef, FusionIngredient } from './PetData';
import type { Pet } from './Pet';
import { canonicalPetName, normalizeFusionNameKey } from '../data/fusion/FusionNameUtils';
import { getRuntimeFusionGuideEntries } from '../data/runtime/RuntimeFusionGuide';

/** Result of a fusion recipe lookup */
export interface FusionMatch {
      resultDef: PetDef;
      recipe: FusionIngredient;
}

export class PetFusion {
      private static _ruleIndex: Map<string, FusionMatch[]> | null = null;
      private static _mappedRuntimeRules = 0;

      /**
       * Find all possible results from fusing pet1 (main) + pet2 (sub).
       * Uses runtime DB fusion formulas as primary source; falls back to PET_DEFS rules only
       * when runtime formulas cannot be mapped to current playable PET_DEFS.
       */
      static findRecipes(pet1: Pet, pet2: Pet): FusionMatch[] {
            const id1 = pet1.def.id;
            const id2 = pet2.def.id;
            this._ensureRuleIndex();
            const key = this._pairKey(id1, id2);
            return [...(this._ruleIndex?.get(key) ?? [])];
      }

      /**
       * Calculate success rate: base 60% + (avgLevel - resultBaseLevel) * 2%, cap 95%, floor 10%.
       */
      static getSuccessRate(pet1: Pet, pet2: Pet, resultDef: PetDef): number {
            const avgLevel = Math.floor((pet1.stats.level + pet2.stats.level) / 2);
            const rate = 60 + (avgLevel - resultDef.baseLevel) * 2;
            return Math.min(Math.max(rate, 10), 95);
      }

      /**
       * Calculate the resulting pet level on success:
       * floor((parentA_Lv + parentB_Lv) / 2) + random(1,6)
       */
      static calcResultLevel(pet1: Pet, pet2: Pet): number {
            return Math.floor((pet1.stats.level + pet2.stats.level) / 2) + Math.floor(Math.random() * 6) + 1;
      }

      /**
       * Execute fusion.
       * Success → secondary consumed, returns new pet def + level.
       * Failure → secondary destroyed, primary loses 3-6 levels (unless protection).
       */
      static fuse(
            primary: Pet, secondary: Pet, resultDef: PetDef, hasProtection: boolean
      ): { success: boolean; resultId?: string; newLevel?: number; primaryLevelDrop?: number } {
            const rate = this.getSuccessRate(primary, secondary, resultDef);
            const roll = Math.random() * 100;

            if (roll < rate) {
                  // Success
                  const newLevel = this.calcResultLevel(primary, secondary);
                  return { success: true, resultId: resultDef.id, newLevel };
            } else {
                  // Failure: secondary consumed, primary drops 3-6 levels
                  const drop = 3 + Math.floor(Math.random() * 4);
                  if (!hasProtection) {
                        primary.stats.level = Math.max(1, primary.stats.level - drop);
                  }
                  return { success: false, primaryLevelDrop: hasProtection ? 0 : drop };
            }
      }

      private static _ensureRuleIndex(): void {
            if (this._ruleIndex) return;

            const mappedRuntimeRules = this._buildMappedRuntimeRules();
            const petDefRules = this._buildPetDefRules();
            const merged = mappedRuntimeRules.length > 0
                  ? this._mergeRules(mappedRuntimeRules, [])
                  : this._mergeRules([], petDefRules);

            this._mappedRuntimeRules = mappedRuntimeRules.length;
            this._ruleIndex = this._indexRules(merged);
      }

      private static _indexRules(rules: FusionMatch[]): Map<string, FusionMatch[]> {
            const index = new Map<string, FusionMatch[]>();
            for (const rule of rules) {
                  const key = this._pairKey(rule.recipe.main, rule.recipe.sub);
                  const list = index.get(key);
                  if (list) list.push(rule);
                  else index.set(key, [rule]);
            }
            return index;
      }

      private static _pairKey(idA: string, idB: string): string {
            return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
      }

      private static _mergeRules(primary: FusionMatch[], secondary: FusionMatch[]): FusionMatch[] {
            const out: FusionMatch[] = [];
            const seen = new Set<string>();

            const pushRule = (rule: FusionMatch): void => {
                  const k = `${rule.resultDef.id}|${rule.recipe.main}|${rule.recipe.sub}`;
                  if (seen.has(k)) return;
                  seen.add(k);
                  out.push(rule);
            };

            for (const rule of primary) pushRule(rule);
            for (const rule of secondary) pushRule(rule);
            return out;
      }

      private static _buildPetDefRules(): FusionMatch[] {
            const rules: FusionMatch[] = [];
            for (const def of PET_DEFS) {
                  if (def.acquisition !== 'fusion' || def.fusionRecipes.length === 0) continue;
                  for (const recipe of def.fusionRecipes) {
                        rules.push({ resultDef: def, recipe });
                  }
            }
            return rules;
      }

      private static _buildMappedRuntimeRules(): FusionMatch[] {
            const rows = getRuntimeFusionGuideEntries();
            if (rows.length === 0) return [];

            const nameIndex = new Map<string, PetDef>();
            for (const def of PET_DEFS) {
                  const canonical = this._canonicalName(def.nameCN);
                  nameIndex.set(canonical, def);
                  nameIndex.set(this._normalizeNameKey(canonical), def);
            }

            const dedupe = new Set<string>();
            const rules: FusionMatch[] = [];
            for (const row of rows) {
                  const resultName = String(row.resultName ?? '').trim();
                  const mainName = String(row.mainName ?? '').trim();
                  const subName = String(row.subName ?? '').trim();
                  if (!resultName || !mainName || !subName) continue;

                  const resultDef = this._resolvePetDefByName(resultName, nameIndex);
                  const mainDef = this._resolvePetDefByName(mainName, nameIndex);
                  const subDef = this._resolvePetDefByName(subName, nameIndex);
                  if (!resultDef || !mainDef || !subDef) continue;

                  const dedupeKey = `${resultDef.id}|${mainDef.id}|${subDef.id}`;
                  if (dedupe.has(dedupeKey)) continue;
                  dedupe.add(dedupeKey);

                  rules.push({
                        resultDef,
                        recipe: { main: mainDef.id, sub: subDef.id },
                  });
            }
            return rules;
      }

      private static _resolvePetDefByName(name: string, nameIndex: Map<string, PetDef>): PetDef | null {
            const canonical = this._canonicalName(name);
            const direct = nameIndex.get(canonical);
            if (direct) return direct;
            return nameIndex.get(this._normalizeNameKey(canonical)) ?? null;
      }

      private static _canonicalName(raw: string): string {
            return canonicalPetName(raw);
      }

      private static _normalizeNameKey(raw: string): string {
            return normalizeFusionNameKey(raw, { aggressive: true });
      }
}
