import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { DroppedItem } from '../systems/DropTable';
import type { ItemRarity } from '../systems/DropTable';
import type { Inventory } from '../systems/Inventory';

const RARITY_COLORS: Record<ItemRarity, Color3> = {
      common: new Color3(0.6, 0.6, 0.6),
      uncommon: new Color3(0.3, 0.6, 1.0),
      rare: new Color3(0.6, 0.3, 0.9),
      epic: new Color3(0.9, 0.75, 0.2),
      legendary: new Color3(1.0, 0.4, 0.1),
};

/**
 * DropItem — 3D rotating pickup mesh.
 * Rotates on Y-axis, magnetic pickup at 2m, lerps into player on pickup.
 */
export class DropItem {
      readonly item: DroppedItem;
      readonly mesh: Mesh;
      private _scene: Scene;
      private _age = 0;
      private _pickedUp = false;
      private _lerpT = 0;
      private _startPos: Vector3;

      static readonly PICKUP_RANGE = 2.0;
      static readonly DESPAWN_TIME = 60;
      static readonly LERP_DURATION = 0.3;

      constructor(scene: Scene, item: DroppedItem, position: Vector3) {
            this._scene = scene;
            this.item = item;
            this._startPos = position.clone();

            // Create small glowing sphere
            this.mesh = MeshBuilder.CreateSphere(`drop_${item.itemId}_${Date.now()}`, {
                  diameter: 0.4, segments: 8,
            }, scene);
            this.mesh.position = position.clone();
            this.mesh.position.y = 0.4;

            const mat = new StandardMaterial(`dropMat_${item.itemId}`, scene);
            const col = RARITY_COLORS[item.rarity] ?? RARITY_COLORS.common;
            mat.emissiveColor = col;
            mat.diffuseColor = col;
            mat.alpha = 0.85;
            this.mesh.material = mat;
      }

      /** Returns true if item should be removed */
      update(dt: number, playerPos: Vector3, inventory: Inventory): boolean {
            if (this._pickedUp) {
                  // Lerp toward player
                  this._lerpT += dt / DropItem.LERP_DURATION;
                  if (this._lerpT >= 1) {
                        this._pickup(inventory);
                        return true;
                  }
                  Vector3.LerpToRef(this._startPos, playerPos, this._lerpT, this.mesh.position);
                  this.mesh.position.y += (1 - this._lerpT) * 0.5;
                  this.mesh.scaling.setAll(1 - this._lerpT * 0.8);
                  return false;
            }

            this._age += dt;
            if (this._age > DropItem.DESPAWN_TIME) return true;

            // Rotate
            this.mesh.rotation.y += 0.5 * dt * Math.PI * 2;

            // Bob up and down
            this.mesh.position.y = 0.4 + Math.sin(this._age * 2) * 0.1;

            // Magnetic pickup
            const dist = Vector3.Distance(this.mesh.position, playerPos);
            if (dist < DropItem.PICKUP_RANGE) {
                  this._pickedUp = true;
                  this._startPos = this.mesh.position.clone();
            }

            return false;
      }

      private _pickup(inventory: Inventory): void {
            inventory.addItem(this.item);
            // Show pickup text
            this._showPickupText();
      }

      private _showPickupText(): void {
            const el = document.createElement('div');
            el.className = 'pickup-text';
            el.textContent = `${this.item.icon} ${this.item.name} x${this.item.qty}`;
            document.getElementById('ui-layer')?.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => el.remove(), 1500);
      }

      dispose(): void {
            this.mesh.dispose(false, true);
      }
}

/**
 * DropItemManager — Manages all active drop items in the scene.
 */
export class DropItemManager {
      private _scene: Scene;
      private _drops: DropItem[] = [];
      private _inventory: Inventory;

      constructor(scene: Scene, inventory: Inventory) {
            this._scene = scene;
            this._inventory = inventory;
      }

      spawnDrops(items: DroppedItem[], position: Vector3): void {
            for (let i = 0; i < items.length; i++) {
                  // Scatter drops slightly
                  const offset = new Vector3(
                        (Math.random() - 0.5) * 2,
                        0,
                        (Math.random() - 0.5) * 2,
                  );
                  const drop = new DropItem(this._scene, items[i], position.add(offset));
                  this._drops.push(drop);
            }
      }

      update(dt: number, playerPos: Vector3): void {
            const toRemove: number[] = [];
            for (let i = 0; i < this._drops.length; i++) {
                  if (this._drops[i].update(dt, playerPos, this._inventory)) {
                        this._drops[i].dispose();
                        toRemove.push(i);
                  }
            }
            // Remove in reverse order
            for (let i = toRemove.length - 1; i >= 0; i--) {
                  this._drops.splice(toRemove[i], 1);
            }
      }

      despawnAll(): void {
            for (const d of this._drops) d.dispose();
            this._drops = [];
      }

      dispose(): void { this.despawnAll(); }
}
