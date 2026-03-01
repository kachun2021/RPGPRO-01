export enum PetEquipSlot {
      Head = 'Head',
      Body = 'Body',
      Claw = 'Claw',
      Ring = 'Ring',
      Necklace = 'Necklace',
      Boots = 'Boots',
}

export interface PetEquipItem {
      id: string;
      name: string;
      slot: PetEquipSlot;
      stats: { atk?: number; def?: number; hp?: number; spd?: number; str?: number; agi?: number };
      icon: string;
}

/** 6 slots, each can be locked (default) and unlocked via shop item */
export const PET_EQUIP_ITEMS: PetEquipItem[] = [
      { id: 'helm_iron', name: 'Iron Helm', slot: PetEquipSlot.Head, stats: { def: 3 }, icon: 'equip_head.png' },
      { id: 'helm_gold', name: 'Golden Crown', slot: PetEquipSlot.Head, stats: { def: 5, atk: 2 }, icon: 'equip_head.png' },
      { id: 'armor_leather', name: 'Leather Vest', slot: PetEquipSlot.Body, stats: { def: 4, hp: 10 }, icon: 'equip_body.png' },
      { id: 'armor_plate', name: 'Plate Armor', slot: PetEquipSlot.Body, stats: { def: 8, hp: 20 }, icon: 'equip_body.png' },
      { id: 'claw_sharp', name: 'Sharp Claws', slot: PetEquipSlot.Claw, stats: { atk: 5 }, icon: 'equip_claw.png' },
      { id: 'claw_flame', name: 'Flame Talons', slot: PetEquipSlot.Claw, stats: { atk: 8, spd: 1 }, icon: 'equip_claw.png' },
      { id: 'ring_power', name: 'Power Ring', slot: PetEquipSlot.Ring, stats: { str: 5, atk: 3 }, icon: 'equip_ring.png' },
      { id: 'neck_guard', name: 'Guard Amulet', slot: PetEquipSlot.Necklace, stats: { def: 4, hp: 15 }, icon: 'equip_neck.png' },
      { id: 'boots_wind', name: 'Wind Boots', slot: PetEquipSlot.Boots, stats: { agi: 4, spd: 2 }, icon: 'equip_boots.png' },
];

/** petId → slot → equipped itemId */
type EquipMap = Map<string, Map<PetEquipSlot, string>>;

/** petId → Set of unlocked slots */
type UnlockMap = Map<string, Set<PetEquipSlot>>;

export class PetEquipment {
      private _equipped: EquipMap = new Map();
      private _unlocked: UnlockMap = new Map();

      /** Check if a slot is unlocked for a pet */
      isSlotUnlocked(petId: string, slot: PetEquipSlot): boolean {
            return this._unlocked.get(petId)?.has(slot) ?? false;
      }

      /** Unlock a slot via shop item */
      unlockSlot(petId: string, slot: PetEquipSlot): void {
            if (!this._unlocked.has(petId)) {
                  this._unlocked.set(petId, new Set());
            }
            this._unlocked.get(petId)!.add(slot);
      }

      equip(petId: string, slot: PetEquipSlot, itemId: string): boolean {
            if (!this.isSlotUnlocked(petId, slot)) return false;
            const item = PET_EQUIP_ITEMS.find(i => i.id === itemId);
            if (!item || item.slot !== slot) return false;

            if (!this._equipped.has(petId)) {
                  this._equipped.set(petId, new Map());
            }
            this._equipped.get(petId)!.set(slot, itemId);
            return true;
      }

      unequip(petId: string, slot: PetEquipSlot): string | null {
            const petMap = this._equipped.get(petId);
            if (!petMap) return null;
            const itemId = petMap.get(slot) || null;
            petMap.delete(slot);
            return itemId;
      }

      getEquipped(petId: string, slot: PetEquipSlot): PetEquipItem | null {
            const itemId = this._equipped.get(petId)?.get(slot);
            if (!itemId) return null;
            return PET_EQUIP_ITEMS.find(i => i.id === itemId) || null;
      }

      getTotalBonus(petId: string): { atk: number; def: number; hp: number; spd: number } {
            const bonus = { atk: 0, def: 0, hp: 0, spd: 0 };
            const petMap = this._equipped.get(petId);
            if (!petMap) return bonus;

            petMap.forEach((itemId) => {
                  const item = PET_EQUIP_ITEMS.find(i => i.id === itemId);
                  if (item) {
                        bonus.atk += item.stats.atk || 0;
                        bonus.def += item.stats.def || 0;
                        bonus.hp += item.stats.hp || 0;
                        bonus.spd += item.stats.spd || 0;
                  }
            });
            return bonus;
      }
}
