import type { Scene } from '@babylonjs/core/scene';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Pet } from './Pet';
import { PET_DEFS, PetSeries, type Gender } from './PetData';

export class PetManager {
      public owned: Pet[] = [];
      public active: Pet[] = []; // max 3
      public readonly MAX_OWNED = 100;
      public readonly MAX_ACTIVE = 3;

      private _scene: Scene;
      private _shadowGen: ShadowGenerator;

      constructor(scene: Scene, shadowGen: ShadowGenerator) {
            this._scene = scene;
            this._shadowGen = shadowGen;
      }

      /** Give 3 starter pets + 2 fusion test ingredients */
      giveStarterPets(): void {
            const starters = [
                  { id: 'p_flowco', gender: 'male' as Gender },
                  { id: 'b_beasco', gender: 'female' as Gender },
                  { id: 'r_birdco', gender: 'male' as Gender },
                  // Test fusion ingredients: p_flowco + d_draco → r_thunderbird (test recipe)
                  { id: 'd_draco', gender: 'male' as Gender },
                  { id: 'p_manglock', gender: 'female' as Gender },
            ];

            for (const s of starters) {
                  const def = PET_DEFS.find(d => d.id === s.id);
                  if (!def) continue;
                  const pet = new Pet(this._scene, def, s.gender, this._shadowGen);
                  this.owned.push(pet);
            }

            // Auto-deploy all 3 starters
            for (let i = 0; i < Math.min(this.owned.length, this.MAX_ACTIVE); i++) {
                  this.deploy(i);
            }

            console.log(`[PetManager] Gave ${starters.length} starter pets, ${this.active.length} deployed`);
      }

      /** Deploy pet at owned index to an active slot */
      deploy(ownedIndex: number): boolean {
            if (this.active.length >= this.MAX_ACTIVE) return false;
            const pet = this.owned[ownedIndex];
            if (!pet || pet.isActive) return false;

            pet.activate(this.active.length);
            this.active.push(pet);
            return true;
      }

      /** Recall pet from active slot */
      recall(activeIndex: number): boolean {
            if (activeIndex < 0 || activeIndex >= this.active.length) return false;
            const pet = this.active[activeIndex];
            pet.deactivate();
            this.active.splice(activeIndex, 1);

            // Re-index remaining
            for (let i = 0; i < this.active.length; i++) {
                  this.active[i].slotIndex = i;
            }
            return true;
      }

      /** Add a new pet from definition */
      addPet(defId: string, gender: Gender): Pet | null {
            if (this.owned.length >= this.MAX_OWNED) return null;
            const def = PET_DEFS.find(d => d.id === defId);
            if (!def) return null;

            const pet = new Pet(this._scene, def, gender, this._shadowGen);
            this.owned.push(pet);
            return pet;
      }

      /** Update all active pet positions */
      update(dt: number, playerPos: Vector3): void {
            for (const pet of this.active) {
                  pet.update(dt, playerPos);
            }
      }

      dispose(): void {
            for (const pet of this.owned) pet.dispose();
            this.owned = [];
            this.active = [];
      }
}
