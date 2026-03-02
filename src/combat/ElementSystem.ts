import { PetSeries, COUNTER_MAP } from '../pets/PetData';

/**
 * Element counter system — 8 series cycle.
 * Plant→Dragon→Beast→Insect→Metal→Mystery→Demon→Bird→Plant
 * Counter: 1.5x | Resisted: 0.7x | Neutral: 1.0x
 */
export class ElementSystem {
      /** Get damage modifier based on attacker vs defender series */
      static getModifier(attackerSeries: PetSeries, defenderSeries: PetSeries): number {
            if (COUNTER_MAP[attackerSeries] === defenderSeries) return 1.5;
            if (COUNTER_MAP[defenderSeries] === attackerSeries) return 0.7;
            return 1.0;
      }

      /** Check if attacker counters defender */
      static isCounter(attackerSeries: PetSeries, defenderSeries: PetSeries): boolean {
            return COUNTER_MAP[attackerSeries] === defenderSeries;
      }

      /** Check if attacker is resisted by defender */
      static isResisted(attackerSeries: PetSeries, defenderSeries: PetSeries): boolean {
            return COUNTER_MAP[defenderSeries] === attackerSeries;
      }

      /** Get counter label for UI display */
      static getLabel(attackerSeries: PetSeries, defenderSeries: PetSeries): string {
            if (this.isCounter(attackerSeries, defenderSeries)) return '克制！';
            if (this.isResisted(attackerSeries, defenderSeries)) return '被克...';
            return '';
      }
}
