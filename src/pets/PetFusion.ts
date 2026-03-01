import { PetSeries, PET_DEFS } from './PetData';
import type { Pet } from './Pet';

export interface FusionRecipe {
      parent1Series: PetSeries;
      parent2Series: PetSeries;
      resultId: string;
      minLevel: number;
}

/** 30+ fusion recipes */
export const FUSION_RECIPES: FusionRecipe[] = [
      // Same-series fusions → higher tier
      { parent1Series: PetSeries.Plant, parent2Series: PetSeries.Plant, resultId: 'p_bloom', minLevel: 5 },
      { parent1Series: PetSeries.Plant, parent2Series: PetSeries.Plant, resultId: 'p_oak', minLevel: 12 },
      { parent1Series: PetSeries.Plant, parent2Series: PetSeries.Plant, resultId: 'p_lotus', minLevel: 20 },
      { parent1Series: PetSeries.Dragon, parent2Series: PetSeries.Dragon, resultId: 'd_wyrm', minLevel: 8 },
      { parent1Series: PetSeries.Dragon, parent2Series: PetSeries.Dragon, resultId: 'd_drake', minLevel: 15 },
      { parent1Series: PetSeries.Dragon, parent2Series: PetSeries.Dragon, resultId: 'd_elder', minLevel: 25 },
      { parent1Series: PetSeries.Beast, parent2Series: PetSeries.Beast, resultId: 'b_wolf', minLevel: 6 },
      { parent1Series: PetSeries.Beast, parent2Series: PetSeries.Beast, resultId: 'b_bear', minLevel: 14 },
      { parent1Series: PetSeries.Beast, parent2Series: PetSeries.Beast, resultId: 'b_tiger', minLevel: 22 },
      { parent1Series: PetSeries.Insect, parent2Series: PetSeries.Insect, resultId: 'i_beetle', minLevel: 5 },
      { parent1Series: PetSeries.Insect, parent2Series: PetSeries.Insect, resultId: 'i_mantis', minLevel: 12 },
      { parent1Series: PetSeries.Insect, parent2Series: PetSeries.Insect, resultId: 'i_spider', minLevel: 20 },
      { parent1Series: PetSeries.Metal, parent2Series: PetSeries.Metal, resultId: 'm_sentinel', minLevel: 7 },
      { parent1Series: PetSeries.Metal, parent2Series: PetSeries.Metal, resultId: 'm_cannon', minLevel: 15 },
      { parent1Series: PetSeries.Metal, parent2Series: PetSeries.Metal, resultId: 'm_golem', minLevel: 24 },
      { parent1Series: PetSeries.Mystery, parent2Series: PetSeries.Mystery, resultId: 'y_fairy', minLevel: 6 },
      { parent1Series: PetSeries.Mystery, parent2Series: PetSeries.Mystery, resultId: 'y_owl', minLevel: 13 },
      { parent1Series: PetSeries.Mystery, parent2Series: PetSeries.Mystery, resultId: 'y_unicorn', minLevel: 22 },
      { parent1Series: PetSeries.Demon, parent2Series: PetSeries.Demon, resultId: 'e_ghoul', minLevel: 8 },
      { parent1Series: PetSeries.Demon, parent2Series: PetSeries.Demon, resultId: 'e_succubus', minLevel: 16 },
      { parent1Series: PetSeries.Demon, parent2Series: PetSeries.Demon, resultId: 'e_reaper', minLevel: 26 },
      { parent1Series: PetSeries.Bird, parent2Series: PetSeries.Bird, resultId: 'r_hawk', minLevel: 5 },
      { parent1Series: PetSeries.Bird, parent2Series: PetSeries.Bird, resultId: 'r_eagle', minLevel: 14 },
      { parent1Series: PetSeries.Bird, parent2Series: PetSeries.Bird, resultId: 'r_gryphon', minLevel: 24 },

      // Cross-series fusions → legendary
      { parent1Series: PetSeries.Plant, parent2Series: PetSeries.Dragon, resultId: 'p_ancient', minLevel: 35 },
      { parent1Series: PetSeries.Dragon, parent2Series: PetSeries.Beast, resultId: 'd_ancient', minLevel: 40 },
      { parent1Series: PetSeries.Beast, parent2Series: PetSeries.Insect, resultId: 'b_king', minLevel: 38 },
      { parent1Series: PetSeries.Insect, parent2Series: PetSeries.Metal, resultId: 'i_queen', minLevel: 36 },
      { parent1Series: PetSeries.Metal, parent2Series: PetSeries.Mystery, resultId: 'm_titan', minLevel: 40 },
      { parent1Series: PetSeries.Mystery, parent2Series: PetSeries.Demon, resultId: 'y_phoenix', minLevel: 38 },
      { parent1Series: PetSeries.Demon, parent2Series: PetSeries.Bird, resultId: 'e_lord', minLevel: 42 },
      { parent1Series: PetSeries.Bird, parent2Series: PetSeries.Plant, resultId: 'r_roc', minLevel: 40 },
];

export class PetFusion {
      /** Find matching recipe for two pets */
      static findRecipe(pet1: Pet, pet2: Pet): FusionRecipe | null {
            const s1 = pet1.def.series;
            const s2 = pet2.def.series;
            const minLv = Math.min(pet1.stats.level, pet2.stats.level);

            return FUSION_RECIPES.find(r =>
                  ((r.parent1Series === s1 && r.parent2Series === s2) ||
                        (r.parent1Series === s2 && r.parent2Series === s1)) &&
                  minLv >= r.minLevel
            ) || null;
      }

      /** Calculate success rate: base 60% + (level-minLevel)*2%, cap 95% */
      static getSuccessRate(pet1: Pet, pet2: Pet, recipe: FusionRecipe): number {
            const avgLevel = Math.floor((pet1.stats.level + pet2.stats.level) / 2);
            const rate = 60 + (avgLevel - recipe.minLevel) * 2;
            return Math.min(Math.max(rate, 10), 95);
      }

      /** Execute fusion. Returns { success, resultDefId, newLevel } or failure info */
      static fuse(
            primary: Pet, secondary: Pet, recipe: FusionRecipe, hasProtection: boolean
      ): { success: boolean; resultId?: string; newLevel?: number; primaryLevelDrop?: number } {
            const rate = this.getSuccessRate(primary, secondary, recipe);
            const roll = Math.random() * 100;

            if (roll < rate) {
                  // Success
                  const newLevel = Math.floor((primary.stats.level + secondary.stats.level) / 2) + Math.floor(Math.random() * 6) + 1;
                  return { success: true, resultId: recipe.resultId, newLevel };
            } else {
                  // Failure: secondary consumed, primary drops 3-6 levels
                  const drop = 3 + Math.floor(Math.random() * 4);
                  if (!hasProtection) {
                        primary.stats.level = Math.max(1, primary.stats.level - drop);
                        // If below base level, pet is lost (handled by caller)
                  }
                  return { success: false, primaryLevelDrop: hasProtection ? 0 : drop };
            }
      }
}
