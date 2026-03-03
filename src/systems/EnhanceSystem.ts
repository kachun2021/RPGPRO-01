/**
 * EnhanceSystem — Equipment enhancement +1 ~ +10.
 * Success rates decrease, failure drops 1 level (min +0).
 */

import type { EquipDef } from './EquipmentSystem';

const ENHANCE_RATES = [0.90, 0.80, 0.70, 0.60, 0.50, 0.40, 0.30, 0.20, 0.15, 0.10];

export interface EnhanceResult {
      success: boolean;
      newLevel: number;
      oldLevel: number;
      protected: boolean;
}

export class EnhanceSystem {
      /** Attempt to enhance an equipment piece */
      enhance(equip: EquipDef, useProtection: boolean = false): EnhanceResult {
            const oldLevel = equip.enhanceLevel;
            if (oldLevel >= 10) {
                  return { success: false, newLevel: 10, oldLevel: 10, protected: false };
            }

            const rate = ENHANCE_RATES[oldLevel] ?? 0.10;
            const success = Math.random() < rate;

            if (success) {
                  equip.enhanceLevel = oldLevel + 1;
                  return { success: true, newLevel: oldLevel + 1, oldLevel, protected: false };
            } else {
                  // Failure: drop 1 level unless protected or at +0
                  if (useProtection || oldLevel === 0) {
                        return { success: false, newLevel: oldLevel, oldLevel, protected: useProtection };
                  }
                  equip.enhanceLevel = oldLevel - 1;
                  return { success: false, newLevel: oldLevel - 1, oldLevel, protected: false };
            }
      }

      /** Get success rate for next enhancement */
      getRate(currentLevel: number): number {
            if (currentLevel >= 10) return 0;
            return ENHANCE_RATES[currentLevel] ?? 0.10;
      }

      /** Get cost in gold for enhancement */
      getCost(currentLevel: number): number {
            return (currentLevel + 1) * 100;
      }
}
