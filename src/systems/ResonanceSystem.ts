/**
 * ResonanceSystem — Resonance potion + equipment → series pet ATK/DEF boost.
 */

import type { PetSeries } from '../pets/PetData';

export interface ResonanceEffect {
      series: PetSeries;
      level: number;
      atkBonus: number;
      defBonus: number;
}

const RESONANCE_TIERS: { level: number; atkBonus: number; defBonus: number }[] = [
      { level: 1, atkBonus: 0.05, defBonus: 0.03 },
      { level: 2, atkBonus: 0.10, defBonus: 0.06 },
      { level: 3, atkBonus: 0.18, defBonus: 0.10 },
      { level: 4, atkBonus: 0.25, defBonus: 0.15 },
      { level: 5, atkBonus: 0.35, defBonus: 0.20 },
];

export class ResonanceSystem {
      private _effects: Map<PetSeries, ResonanceEffect> = new Map();
      private _onChange: (() => void) | null = null;

      set onChange(cb: (() => void) | null) { this._onChange = cb; }

      /** Apply resonance to a series */
      applyResonance(series: PetSeries): boolean {
            const current = this._effects.get(series);
            const currentLevel = current?.level ?? 0;
            if (currentLevel >= 5) return false;

            const tier = RESONANCE_TIERS[currentLevel];
            if (!tier) return false;

            this._effects.set(series, {
                  series,
                  level: tier.level,
                  atkBonus: tier.atkBonus,
                  defBonus: tier.defBonus,
            });
            this._onChange?.();
            return true;
      }

      /** Get bonus for a specific series */
      getBonus(series: PetSeries): ResonanceEffect | null {
            return this._effects.get(series) ?? null;
      }

      /** Get all active resonance effects */
      getAllEffects(): ResonanceEffect[] {
            return Array.from(this._effects.values());
      }

      /** Calculate ATK bonus multiplier for a pet series */
      getAtkMultiplier(series: PetSeries): number {
            const effect = this._effects.get(series);
            return 1 + (effect?.atkBonus ?? 0);
      }

      /** Calculate DEF bonus multiplier for a pet series */
      getDefMultiplier(series: PetSeries): number {
            const effect = this._effects.get(series);
            return 1 + (effect?.defBonus ?? 0);
      }
}
