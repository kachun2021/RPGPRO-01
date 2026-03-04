/**
 * RebirthSystem — Prestige loop for endgame progression.
 * Lv >= 80 + awakened → reset level to 1, permanent +3 all stats per rebirth.
 * Keeps: inventory, pets, gold, diamond.
 * Resets: level, exp, skill tree.
 */
import type { StatAllocation } from './StatAllocation';
import type { SkillTree } from './SkillTree';
import type { PlayerStats } from '../entities/Player';

export class RebirthSystem {
      rebirthCount = 0;

      /** Required level for rebirth */
      static readonly REQUIRED_LEVEL = 80;
      /** Permanent stat bonus per rebirth */
      static readonly BONUS_PER_REBIRTH = 3;

      /** Check if player can rebirth */
      canRebirth(level: number, isAwakened: boolean): boolean {
            return level >= RebirthSystem.REQUIRED_LEVEL && isAwakened;
      }

      /** Perform rebirth */
      rebirth(
            stats: PlayerStats,
            statAlloc: StatAllocation,
            skillTree: SkillTree,
      ): boolean {
            if (!this.canRebirth(stats.level, true)) return false;

            this.rebirthCount++;

            // Reset level and exp
            stats.level = 1;
            stats.exp = 0;

            // Reset stat allocations (refund points)
            statAlloc.resetAllocations();
            // Clear level-up stat points (only keep base 0 since Lv1)
            statAlloc.statPoints = 0;

            // Apply permanent rebirth bonus
            statAlloc.applyRebirthBonus(this.rebirthCount);

            // Reset skill tree (refund all SP)
            skillTree.reset();
            // Clear SP (since level is 1)
            skillTree.skillPoints = 0;

            // Recalculate HP/MP from new stats
            statAlloc.applyTo(stats);
            stats.hp = stats.maxHp;
            stats.mp = stats.maxMp;

            console.log(
                  `[RebirthSystem] Rebirth #${this.rebirthCount}! ` +
                  `Permanent +${this.rebirthCount * RebirthSystem.BONUS_PER_REBIRTH} all stats`
            );
            return true;
      }

      /** Get status text for UI */
      getStatusText(level: number, isAwakened: boolean): string {
            if (!isAwakened) return '🔒 需要先覺醒';
            if (level < RebirthSystem.REQUIRED_LEVEL) {
                  return `🔒 等級 ${level}/${RebirthSystem.REQUIRED_LEVEL}`;
            }
            return '⚡ 可轉生！';
      }

      /** Get rebirth info for display */
      getInfo(): { count: number; permanentBonus: number } {
            return {
                  count: this.rebirthCount,
                  permanentBonus: this.rebirthCount * RebirthSystem.BONUS_PER_REBIRTH,
            };
      }
}
