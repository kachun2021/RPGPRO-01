export interface BuffDef {
      id: string;
      name: string;
      icon: string;
      effect?: { atk?: number; def?: number; hp?: number; str?: number; agi?: number };
      /** Percentage bonus (e.g. 5 = +5%) */
      effectPercent?: { atk?: number; str?: number; agi?: number };
      durationMs: number;
      description: string;
}

/** Shop buff potions */
export const BUFF_DEFS: BuffDef[] = [
      { id: 'buff_atk5', name: 'Attack Potion', icon: 'buff_atk.png', effectPercent: { atk: 5 }, durationMs: 3600000, description: '+5% ATK for 1 hour' },
      { id: 'buff_def5', name: 'Defense Potion', icon: 'buff_def.png', effect: { def: 10 }, durationMs: 3600000, description: '+10 DEF for 1 hour' },
      { id: 'buff_str5', name: 'Strength Potion', icon: 'buff_str.png', effectPercent: { str: 5 }, durationMs: 3600000, description: '+5% STR for 1 hour' },
      { id: 'buff_agi5', name: 'Speed Potion', icon: 'buff_agi.png', effectPercent: { agi: 5 }, durationMs: 1800000, description: '+5% AGI for 30 min' },
      { id: 'buff_hp10', name: 'Vitality Potion', icon: 'buff_hp.png', effect: { hp: 50 }, durationMs: 3600000, description: '+50 HP for 1 hour' },
];

interface ActiveBuff {
      buffId: string;
      appliedAt: number;
      expiresAt: number;
}

export class PetBuff {
      /** petId → array of active buffs (max 5 slots) */
      private _active = new Map<string, ActiveBuff[]>();
      private static MAX_BUFF_SLOTS = 5;

      /** Apply a buff potion to a pet */
      applyBuff(petId: string, buffId: string): boolean {
            const def = BUFF_DEFS.find(b => b.id === buffId);
            if (!def) return false;

            if (!this._active.has(petId)) {
                  this._active.set(petId, []);
            }
            const buffs = this._active.get(petId)!;

            // Cleanup expired
            const now = Date.now();
            const alive = buffs.filter(b => b.expiresAt > now);

            if (alive.length >= PetBuff.MAX_BUFF_SLOTS) return false;

            alive.push({
                  buffId,
                  appliedAt: now,
                  expiresAt: now + def.durationMs,
            });
            this._active.set(petId, alive);
            return true;
      }

      /** Get active buffs for display */
      getActiveBuffs(petId: string): Array<{ def: BuffDef; remainingMs: number }> {
            const now = Date.now();
            const buffs = this._active.get(petId) || [];
            const result: Array<{ def: BuffDef; remainingMs: number }> = [];

            for (const b of buffs) {
                  if (b.expiresAt > now) {
                        const def = BUFF_DEFS.find(d => d.id === b.buffId);
                        if (def) result.push({ def, remainingMs: b.expiresAt - now });
                  }
            }
            return result;
      }

      /** Get buff slot contents (5 slots, null if empty) */
      getSlots(petId: string): Array<{ def: BuffDef; remainingMs: number } | null> {
            const active = this.getActiveBuffs(petId);
            const slots: Array<{ def: BuffDef; remainingMs: number } | null> = [];
            for (let i = 0; i < PetBuff.MAX_BUFF_SLOTS; i++) {
                  slots.push(active[i] || null);
            }
            return slots;
      }
}
