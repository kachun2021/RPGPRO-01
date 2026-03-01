import { PET_DEFS } from './PetData';

interface EncEntry {
      discovered: boolean;
      count: number;
}

export class PetEncyclopedia {
      private _entries = new Map<string, EncEntry>();

      constructor() {
            // Init all 40 species as undiscovered
            for (const def of PET_DEFS) {
                  this._entries.set(def.id, { discovered: false, count: 0 });
            }
      }

      /** Mark a pet as discovered (called when pet is obtained) */
      register(id: string): void {
            const entry = this._entries.get(id);
            if (entry) {
                  entry.discovered = true;
                  entry.count++;
            }
      }

      isDiscovered(id: string): boolean {
            return this._entries.get(id)?.discovered ?? false;
      }

      getCount(id: string): number {
            return this._entries.get(id)?.count ?? 0;
      }

      get discoveredCount(): number {
            let n = 0;
            this._entries.forEach(e => { if (e.discovered) n++; });
            return n;
      }

      get totalCount(): number {
            return this._entries.size;
      }

      /** Get all entries for display */
      getAll(): Array<{ id: string; discovered: boolean; count: number }> {
            const result: Array<{ id: string; discovered: boolean; count: number }> = [];
            this._entries.forEach((entry, id) => {
                  result.push({ id, ...entry });
            });
            return result;
      }
}
