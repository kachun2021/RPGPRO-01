import type { Pet } from './Pet';
import { COUNTER_MAP, PetSeries } from './PetData';

export class PetAI {
      private _attackInterval = 1.2;
      private _timer = 0;

      /** Update AI: attack nearest target, prefer countered series */
      update(pet: Pet, dt: number, targets: Array<{ position: { x: number; z: number }; series?: PetSeries; hp: number }>): { targetIndex: number; attack: boolean } | null {
            if (!pet.isActive || targets.length === 0) return null;

            this._timer += dt;
            if (this._timer < this._attackInterval) return null;
            this._timer = 0;

            // Find best target: countered series priority, then nearest
            const petPos = pet.root.position;
            const counteredSeries = COUNTER_MAP[pet.def.series];

            let bestIdx = 0;
            let bestScore = -Infinity;

            for (let i = 0; i < targets.length; i++) {
                  const t = targets[i];
                  if (t.hp <= 0) continue;
                  const dx = t.position.x - petPos.x;
                  const dz = t.position.z - petPos.z;
                  const dist = Math.sqrt(dx * dx + dz * dz);

                  // Score: counter bonus (100) - distance
                  let score = -dist;
                  if (t.series && t.series === counteredSeries) {
                        score += 100; // Strong preference for countered series
                  }

                  if (score > bestScore) {
                        bestScore = score;
                        bestIdx = i;
                  }
            }

            return { targetIndex: bestIdx, attack: true };
      }

      /** Get counter damage multiplier */
      static getCounterMultiplier(attackerSeries: PetSeries, defenderSeries: PetSeries): number {
            if (COUNTER_MAP[attackerSeries] === defenderSeries) return 1.5;
            if (COUNTER_MAP[defenderSeries] === attackerSeries) return 0.7;
            return 1.0;
      }
}
