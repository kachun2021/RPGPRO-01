/**
 * AwakeningSystem — One-time milestone unlock at Lv >= 50.
 * Grants +10 stat points, +5 skill points, and a visual aura.
 */
import type { StatAllocation } from './StatAllocation';
import type { SkillTree } from './SkillTree';

export class AwakeningSystem {
      isAwakened = false;

      /** Required level for awakening */
      static readonly REQUIRED_LEVEL = 50;
      /** Required quest chapter */
      static readonly REQUIRED_CHAPTER = 15;
      /** Stat points granted */
      static readonly STAT_REWARD = 10;
      /** Skill points granted */
      static readonly SP_REWARD = 5;

      /** Check if player meets conditions */
      canAwaken(level: number, questChapter: number): boolean {
            if (this.isAwakened) return false;
            return level >= AwakeningSystem.REQUIRED_LEVEL
                  && questChapter >= AwakeningSystem.REQUIRED_CHAPTER;
      }

      /** Perform awakening — grants stat + skill points */
      awaken(
            level: number,
            questChapter: number,
            statAlloc: StatAllocation,
            skillTree: SkillTree,
      ): boolean {
            if (!this.canAwaken(level, questChapter)) return false;

            this.isAwakened = true;
            statAlloc.statPoints += AwakeningSystem.STAT_REWARD;
            skillTree.skillPoints += AwakeningSystem.SP_REWARD;

            console.log('[AwakeningSystem] Player awakened! +10 stat pts, +5 SP');
            return true;
      }

      /** Get status text for UI */
      getStatusText(level: number, questChapter: number): string {
            if (this.isAwakened) return '✅ 已覺醒';
            const conditions: string[] = [];
            if (level < AwakeningSystem.REQUIRED_LEVEL) {
                  conditions.push(`等級 ${level}/${AwakeningSystem.REQUIRED_LEVEL}`);
            }
            if (questChapter < AwakeningSystem.REQUIRED_CHAPTER) {
                  conditions.push(`主線 ${questChapter}/${AwakeningSystem.REQUIRED_CHAPTER}章`);
            }
            return conditions.length > 0
                  ? `🔒 需要: ${conditions.join(' + ')}`
                  : '⚡ 可覺醒！';
      }
}
