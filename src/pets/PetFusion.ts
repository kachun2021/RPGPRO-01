import { PET_DEFS } from './PetData';
import type { PetDef, FusionIngredient } from './PetData';
import type { Pet } from './Pet';

/** Result of a fusion recipe lookup */
export interface FusionMatch {
      resultDef: PetDef;
      recipe: FusionIngredient;
}

export class PetFusion {
      /**
       * Find all possible results from fusing pet1 (main) + pet2 (sub).
       * Searches PET_DEFS for any pet whose fusionRecipes contain { main: pet1.def.id, sub: pet2.def.id }.
       * Also checks reverse (pet2 as main, pet1 as sub).
       */
      static findRecipes(pet1: Pet, pet2: Pet): FusionMatch[] {
            const matches: FusionMatch[] = [];
            const id1 = pet1.def.id;
            const id2 = pet2.def.id;

            for (const def of PET_DEFS) {
                  if (def.acquisition !== 'fusion' || def.fusionRecipes.length === 0) continue;

                  for (const recipe of def.fusionRecipes) {
                        // Check both directions
                        if ((recipe.main === id1 && recipe.sub === id2) ||
                              (recipe.main === id2 && recipe.sub === id1)) {
                              matches.push({ resultDef: def, recipe });
                        }
                  }
            }
            return matches;
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
}
