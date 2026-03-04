/**
 * StatAllocation — Five-dimensional stat system.
 * str(力)/agi(敏)/acc(準)/int(智)/attr(屬)
 * Extracted from CharacterPanel for reuse across systems.
 */

export interface BaseStats {
      str: number;
      agi: number;
      acc: number;
      int: number;
      attr: number;
}

export interface DerivedStats {
      atk: number;
      def: number;
      maxHp: number;
      maxMp: number;
      dodgePct: number;
      hitRate: number;
}

const STAT_KEYS: (keyof BaseStats)[] = ['str', 'agi', 'acc', 'int', 'attr'];

export class StatAllocation {
      /** Allocated base stats */
      base: BaseStats = { str: 5, agi: 5, acc: 5, int: 5, attr: 5 };

      /** Unspent stat points */
      statPoints = 0;

      /** Permanent bonus per rebirth (+3 all per rebirth) */
      rebirthBonus = 0;

      /** Points per level-up */
      static readonly POINTS_PER_LEVEL = 5;

      /** Extra points from rebirth */
      static readonly REBIRTH_EXTRA_POINTS = 3;

      /** Add 1 point to a stat (spends 1 stat point) */
      addPoint(stat: keyof BaseStats): boolean {
            if (this.statPoints <= 0) return false;
            this.base[stat]++;
            this.statPoints--;
            return true;
      }

      /** Remove 1 point from a stat (refunds 1 stat point, minimum 1) */
      removePoint(stat: keyof BaseStats): boolean {
            if (this.base[stat] <= 1) return false;
            this.base[stat]--;
            this.statPoints++;
            return true;
      }

      /** Called on level-up: grant 5 stat points */
      onLevelUp(): void {
            this.statPoints += StatAllocation.POINTS_PER_LEVEL;
      }

      /** Apply rebirth permanent bonus to all base stats */
      applyRebirthBonus(rebirthCount: number): void {
            this.rebirthBonus = rebirthCount * StatAllocation.REBIRTH_EXTRA_POINTS;
      }

      /** Get effective base stats (allocated + rebirth bonus) */
      getEffective(): BaseStats {
            const eff = { ...this.base };
            for (const k of STAT_KEYS) {
                  eff[k] += this.rebirthBonus;
            }
            return eff;
      }

      /** Compute derived stats from effective base */
      getDerived(): DerivedStats {
            const e = this.getEffective();
            return {
                  atk: Math.round(e.str * 2.5),
                  def: Math.round(e.acc * 1.5 + e.attr * 1.0),
                  maxHp: e.str * 10 + e.acc * 5,
                  maxMp: e.int * 8,
                  dodgePct: parseFloat((e.agi * 0.3).toFixed(1)),
                  hitRate: e.acc * 2,
            };
      }

      /** Apply derived stats to a PlayerStats object */
      applyTo(stats: { maxHp: number; maxMp: number; hp: number; mp: number }): void {
            const d = this.getDerived();
            stats.maxHp = d.maxHp;
            stats.maxMp = d.maxMp;
            stats.hp = Math.min(stats.hp, stats.maxHp);
            stats.mp = Math.min(stats.mp, stats.maxMp);
      }

      /** Reset all allocations (for rebirth) */
      resetAllocations(): void {
            const totalSpent = STAT_KEYS.reduce((sum, k) => sum + (this.base[k] - 5), 0);
            this.statPoints += totalSpent;
            for (const k of STAT_KEYS) this.base[k] = 5;
      }
}
