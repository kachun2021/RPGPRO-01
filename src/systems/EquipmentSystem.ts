/**
 * EquipmentSystem — Player equipment with 8 slots, set bonuses, and stat calculation.
 */

import type { ItemRarity } from './DropTable';
import type { Inventory } from './Inventory';

export type EquipSlot = 'head' | 'armor' | 'gloves' | 'boots' | 'bracelet' | 'ring' | 'necklace' | 'weapon';

export const EQUIP_SLOTS: { id: EquipSlot; label: string; icon: string }[] = [
      { id: 'weapon', label: '武器', icon: '⚔️' },
      { id: 'head', label: '頭盔', icon: '🪖' },
      { id: 'armor', label: '鎧甲', icon: '🛡️' },
      { id: 'gloves', label: '手套', icon: '🧤' },
      { id: 'boots', label: '靴子', icon: '👢' },
      { id: 'bracelet', label: '手鐲', icon: '💍' },
      { id: 'ring', label: '戒指', icon: '💎' },
      { id: 'necklace', label: '項鏈', icon: '📿' },
];

export interface EquipStats {
      atk: number;
      def: number;
      hp: number;
      mp: number;
}

export interface EquipDef {
      id: string;
      name: string;
      slot: EquipSlot;
      level: number;
      rarity: ItemRarity;
      stats: EquipStats;
      setId?: string;
      enhanceLevel: number;
      icon: string;
}

export interface SetBonus {
      id: string;
      name: string;
      pieces2: string;
      pieces4: string;
      pieces6: string;
      effect2: Partial<{ petDmgBonus: number; dmgReduction: number }>;
      effect4: Partial<{ petDmgBonus: number; dmgReduction: number }>;
      effect6: Partial<{ petDmgBonus: number; dmgReduction: number }>;
}

const SET_DEFS: SetBonus[] = [
      {
            id: 'boss_set', name: 'Boss套裝',
            pieces2: '寵物傷害 +15%', pieces4: '寵物傷害 +25%', pieces6: '寵物傷害 +35%',
            effect2: { petDmgBonus: 0.15 }, effect4: { petDmgBonus: 0.25 }, effect6: { petDmgBonus: 0.35 },
      },
      {
            id: 'pvp_set', name: 'PVP套裝',
            pieces2: '減傷 +10%', pieces4: '減傷 +20%', pieces6: '減傷 +30%',
            effect2: { dmgReduction: 0.10 }, effect4: { dmgReduction: 0.20 }, effect6: { dmgReduction: 0.30 },
      },
];

/** Starter equipment that drops from bosses */
export const EQUIP_TEMPLATES: Omit<EquipDef, 'enhanceLevel'>[] = [
      { id: 'iron_sword', name: '鐵劍', slot: 'weapon', level: 1, rarity: 'common', stats: { atk: 8, def: 0, hp: 0, mp: 0 }, icon: '⚔️' },
      { id: 'iron_helm', name: '鐵盔', slot: 'head', level: 1, rarity: 'common', stats: { atk: 0, def: 3, hp: 20, mp: 0 }, icon: '🪖' },
      { id: 'iron_armor', name: '鐵甲', slot: 'armor', level: 1, rarity: 'common', stats: { atk: 0, def: 5, hp: 30, mp: 0 }, icon: '🛡️' },
      { id: 'iron_gloves', name: '鐵手套', slot: 'gloves', level: 1, rarity: 'common', stats: { atk: 2, def: 2, hp: 0, mp: 0 }, icon: '🧤' },
      { id: 'iron_boots', name: '鐵靴', slot: 'boots', level: 1, rarity: 'common', stats: { atk: 0, def: 3, hp: 10, mp: 0 }, icon: '👢' },
      { id: 'bone_bracelet', name: '骨手鐲', slot: 'bracelet', level: 5, rarity: 'uncommon', stats: { atk: 3, def: 1, hp: 0, mp: 10 }, icon: '💍' },
      { id: 'jade_ring', name: '玉戒指', slot: 'ring', level: 5, rarity: 'uncommon', stats: { atk: 4, def: 0, hp: 0, mp: 15 }, icon: '💎' },
      { id: 'wolf_necklace', name: '狼牙項鏈', slot: 'necklace', level: 5, rarity: 'uncommon', stats: { atk: 2, def: 2, hp: 15, mp: 5 }, icon: '📿' },
      // Boss set pieces
      { id: 'boss_sword', name: 'Boss魔劍', slot: 'weapon', level: 30, rarity: 'epic', stats: { atk: 25, def: 0, hp: 0, mp: 10 }, setId: 'boss_set', icon: '⚔️' },
      { id: 'boss_helm', name: 'Boss魔盔', slot: 'head', level: 30, rarity: 'epic', stats: { atk: 0, def: 12, hp: 80, mp: 0 }, setId: 'boss_set', icon: '🪖' },
      { id: 'boss_armor', name: 'Boss魔甲', slot: 'armor', level: 30, rarity: 'epic', stats: { atk: 0, def: 18, hp: 100, mp: 0 }, setId: 'boss_set', icon: '🛡️' },
      { id: 'boss_gloves', name: 'Boss魔手套', slot: 'gloves', level: 30, rarity: 'epic', stats: { atk: 10, def: 8, hp: 0, mp: 20 }, setId: 'boss_set', icon: '🧤' },
      { id: 'boss_boots', name: 'Boss魔靴', slot: 'boots', level: 30, rarity: 'epic', stats: { atk: 0, def: 10, hp: 50, mp: 0 }, setId: 'boss_set', icon: '👢' },
      { id: 'boss_bracelet', name: 'Boss魔鐲', slot: 'bracelet', level: 30, rarity: 'epic', stats: { atk: 8, def: 5, hp: 30, mp: 30 }, setId: 'boss_set', icon: '💍' },
      { id: 'boss_ring', name: 'Boss魔戒', slot: 'ring', level: 30, rarity: 'epic', stats: { atk: 12, def: 3, hp: 0, mp: 40 }, setId: 'boss_set', icon: '💎' },
      { id: 'boss_necklace', name: 'Boss魔鏈', slot: 'necklace', level: 30, rarity: 'epic', stats: { atk: 6, def: 6, hp: 60, mp: 20 }, setId: 'boss_set', icon: '📿' },
];

export class EquipmentSystem {
      private _equipped: Map<EquipSlot, EquipDef> = new Map();
      private _onChange: (() => void) | null = null;

      set onChange(cb: (() => void) | null) { this._onChange = cb; }

      get equipped(): Map<EquipSlot, EquipDef> { return this._equipped; }

      equip(item: EquipDef): EquipDef | null {
            const prev = this._equipped.get(item.slot) ?? null;
            this._equipped.set(item.slot, item);
            this._onChange?.();
            return prev; // Return unequipped item (for inventory)
      }

      unequip(slot: EquipSlot): EquipDef | null {
            const prev = this._equipped.get(slot) ?? null;
            this._equipped.delete(slot);
            this._onChange?.();
            return prev;
      }

      getSlot(slot: EquipSlot): EquipDef | null {
            return this._equipped.get(slot) ?? null;
      }

      /** Total stats from all equipped items (with enhancement bonus) */
      getTotalStats(): EquipStats {
            const total: EquipStats = { atk: 0, def: 0, hp: 0, mp: 0 };
            for (const eq of this._equipped.values()) {
                  const mult = 1 + eq.enhanceLevel * 0.08; // +8% per enhance level
                  total.atk += Math.round(eq.stats.atk * mult);
                  total.def += Math.round(eq.stats.def * mult);
                  total.hp += Math.round(eq.stats.hp * mult);
                  total.mp += Math.round(eq.stats.mp * mult);
            }
            return total;
      }

      /** Get active set bonuses */
      getSetBonuses(): { set: SetBonus; count: number; activeEffects: string[] }[] {
            const setCounts = new Map<string, number>();
            for (const eq of this._equipped.values()) {
                  if (eq.setId) setCounts.set(eq.setId, (setCounts.get(eq.setId) ?? 0) + 1);
            }

            const results: { set: SetBonus; count: number; activeEffects: string[] }[] = [];
            for (const [setId, count] of setCounts) {
                  const setDef = SET_DEFS.find(s => s.id === setId);
                  if (!setDef) continue;
                  const effects: string[] = [];
                  if (count >= 2) effects.push(setDef.pieces2);
                  if (count >= 4) effects.push(setDef.pieces4);
                  if (count >= 6) effects.push(setDef.pieces6);
                  if (effects.length > 0) results.push({ set: setDef, count, activeEffects: effects });
            }
            return results;
      }

      /** Pet damage bonus from Boss set */
      get petDmgBonus(): number {
            const bonuses = this.getSetBonuses();
            let total = 0;
            for (const { set, count } of bonuses) {
                  if (count >= 6 && set.effect6.petDmgBonus) total += set.effect6.petDmgBonus;
                  else if (count >= 4 && set.effect4.petDmgBonus) total += set.effect4.petDmgBonus;
                  else if (count >= 2 && set.effect2.petDmgBonus) total += set.effect2.petDmgBonus;
            }
            return total;
      }

      /** Damage reduction from PVP set */
      get dmgReduction(): number {
            const bonuses = this.getSetBonuses();
            let total = 0;
            for (const { set, count } of bonuses) {
                  if (count >= 6 && set.effect6.dmgReduction) total += set.effect6.dmgReduction;
                  else if (count >= 4 && set.effect4.dmgReduction) total += set.effect4.dmgReduction;
                  else if (count >= 2 && set.effect2.dmgReduction) total += set.effect2.dmgReduction;
            }
            return total;
      }

      /** Give starter equipment to new player */
      giveStarterGear(): void {
            const starters = ['iron_sword', 'iron_helm', 'iron_armor', 'iron_boots'];
            for (const id of starters) {
                  const tmpl = EQUIP_TEMPLATES.find(t => t.id === id);
                  if (tmpl) this.equip({ ...tmpl, enhanceLevel: 0 });
            }
      }
}
