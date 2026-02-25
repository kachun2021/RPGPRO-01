import { Observable } from "@babylonjs/core/Misc/observable";
import { ItemDatabase, ItemDef } from "./ItemDatabase";

export interface InventorySlot {
      itemId: string;
      quantity: number;
}

/**
 * Inventory — 30-slot (5×6) item storage with stacking
 */
export class Inventory {
      public readonly onChanged = new Observable<InventorySlot[]>();

      private slots: (InventorySlot | null)[];
      private maxSlots: number;

      constructor(maxSlots = 30) {
            this.maxSlots = maxSlots;
            this.slots = new Array(maxSlots).fill(null);

            // Start with some basic items
            this.addItem("hp_potion", 5);
            this.addItem("mp_potion", 3);
            this.addItem("iron_ore", 8);
      }

      /**
       * Add item to inventory. Returns true if space was found.
       */
      public addItem(itemId: string, quantity: number = 1): boolean {
            const def = ItemDatabase.get(itemId);
            if (!def) return false;

            // Try stacking first
            if (def.stackable) {
                  for (let i = 0; i < this.maxSlots; i++) {
                        const slot = this.slots[i];
                        if (slot && slot.itemId === itemId && slot.quantity < def.maxStack) {
                              const space = def.maxStack - slot.quantity;
                              const add = Math.min(quantity, space);
                              slot.quantity += add;
                              quantity -= add;
                              if (quantity <= 0) {
                                    this.onChanged.notifyObservers(this.getItems());
                                    return true;
                              }
                        }
                  }
            }

            // Find empty slots for remaining
            while (quantity > 0) {
                  const emptyIdx = this.slots.indexOf(null);
                  if (emptyIdx === -1) {
                        console.warn(`[Inventory] Full! Cannot add ${quantity}× ${def.name}`);
                        this.onChanged.notifyObservers(this.getItems());
                        return false;
                  }
                  const add = def.stackable ? Math.min(quantity, def.maxStack) : 1;
                  this.slots[emptyIdx] = { itemId, quantity: add };
                  quantity -= add;
            }

            this.onChanged.notifyObservers(this.getItems());
            return true;
      }

      /**
       * Remove quantity of an item. Returns true if sufficient items existed.
       */
      public removeItem(itemId: string, quantity: number = 1): boolean {
            let remaining = quantity;

            for (let i = this.maxSlots - 1; i >= 0; i--) {
                  const slot = this.slots[i];
                  if (slot && slot.itemId === itemId) {
                        const take = Math.min(remaining, slot.quantity);
                        slot.quantity -= take;
                        remaining -= take;
                        if (slot.quantity <= 0) {
                              this.slots[i] = null;
                        }
                        if (remaining <= 0) break;
                  }
            }

            if (remaining > 0) return false;
            this.onChanged.notifyObservers(this.getItems());
            return true;
      }

      public hasItem(itemId: string, quantity: number = 1): boolean {
            let total = 0;
            for (const slot of this.slots) {
                  if (slot && slot.itemId === itemId) total += slot.quantity;
            }
            return total >= quantity;
      }

      public getItemCount(itemId: string): number {
            let total = 0;
            for (const slot of this.slots) {
                  if (slot && slot.itemId === itemId) total += slot.quantity;
            }
            return total;
      }

      public getSlot(index: number): InventorySlot | null {
            return this.slots[index] || null;
      }

      public getItems(): InventorySlot[] {
            return this.slots.filter(Boolean) as InventorySlot[];
      }

      public getAllSlots(): (InventorySlot | null)[] {
            return [...this.slots];
      }

      public getMaxSlots(): number {
            return this.maxSlots;
      }

      public isFull(): boolean {
            return this.slots.every(s => s !== null);
      }
}
