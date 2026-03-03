import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { SERIES_COLORS, type PetSeries } from '../pets/PetData';

export interface Projectile {
      mesh: AbstractMesh;
      target: Vector3;
      speed: number;
      damage: number;
      series: PetSeries;
      onHit: (pos: Vector3) => void;
}

/**
 * ProjectileSystem — manages ranged pet attack projectiles.
 * Ranged pets shoot series-colored emissive spheres that travel to targets.
 */
export class ProjectileSystem {
      private _scene: Scene;
      private _projectiles: Projectile[] = [];
      private _matCache = new Map<PetSeries, PBRMaterial>();

      constructor(scene: Scene) {
            this._scene = scene;
      }

      /** Get or create cached PBR material for a series */
      private _getMaterial(series: PetSeries): PBRMaterial {
            let mat = this._matCache.get(series);
            if (!mat) {
                  mat = new PBRMaterial(`proj_mat_${series}`, this._scene);
                  const color = SERIES_COLORS[series];
                  mat.albedoColor = color;
                  mat.emissiveColor = color;
                  mat.emissiveIntensity = 0.8;
                  mat.roughness = 0.2;
                  mat.metallic = 0.0;
                  mat.alpha = 0.9;
                  this._matCache.set(series, mat);
            }
            return mat;
      }

      /** Spawn a projectile from origin toward target */
      spawn(origin: Vector3, target: Vector3, series: PetSeries, damage: number, onHit: (pos: Vector3) => void): void {
            const sphere = MeshBuilder.CreateSphere(`proj_${Date.now()}`, { diameter: 0.6, segments: 8 }, this._scene);
            sphere.position.copyFrom(origin);
            sphere.position.y += 1.0; // launch from chest height
            sphere.material = this._getMaterial(series);

            this._projectiles.push({
                  mesh: sphere,
                  target: target.clone(),
                  speed: 6.0,  // Slower so player can see projectile travel
                  damage,
                  series,
                  onHit,
            });
      }

      /** Update all projectiles — call every frame */
      update(dt: number): void {
            for (let i = this._projectiles.length - 1; i >= 0; i--) {
                  const p = this._projectiles[i];
                  const targetY = p.target.clone();
                  targetY.y += 0.8; // Target chest height
                  const dir = targetY.subtract(p.mesh.position);
                  const dist = dir.length();

                  if (dist < 0.6) {
                        // Hit target
                        p.onHit(p.target);
                        p.mesh.dispose();
                        this._projectiles.splice(i, 1);
                  } else {
                        // Move toward target
                        const move = dir.normalizeToNew().scaleInPlace(p.speed * dt);
                        p.mesh.position.addInPlace(move);
                        // Slight arc effect
                        const progress = 1 - (dist / Vector3.Distance(p.mesh.position, targetY));
                        p.mesh.position.y += Math.sin(progress * Math.PI) * 0.02;
                  }
            }
      }

      /** Clean up all projectiles */
      dispose(): void {
            for (const p of this._projectiles) {
                  p.mesh.dispose();
            }
            this._projectiles.length = 0;
            this._matCache.forEach(m => m.dispose());
            this._matCache.clear();
      }
}
