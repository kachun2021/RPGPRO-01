import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { GPUParticleSystem } from "@babylonjs/core/Particles/gpuParticleSystem";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { Registry } from "../core/Registry";

const DOT_TEX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJklEQVQYV2P8////fwYiACNIAZZEZEVYFTBiUYRVATYT0RVhNREAx74Hsfh+JcUAAAAASUVORK5CYII=";

export type LootType = "gold" | "equipment" | "material";

interface DropItemData {
      mesh: Mesh;
      mat: StandardMaterial;
      particles: GPUParticleSystem | ParticleSystem | null;
      lootType: LootType;
      value: number;
      collectible: boolean;
      elapsed: number;
}

/**
 * DropSystem — manages all ground loot drops.
 * Magnetic: within 8m → lerp-fly to player 0.5s → pickup → dispose.
 * Visual: rotating gold cylinder + GPUParticle glow trail.
 */
export class DropSystem {
      private _scene: Scene;
      private _drops: DropItemData[] = [];
      private _sharedTex: Texture;

      constructor(scene: Scene) {
            this._scene = scene;
            this._sharedTex = new Texture(DOT_TEX, scene);
      }

      /** Spawn a drop at world position (call from Monster.onDeath) */
      spawnDrop(worldPos: Vector3, lootType: LootType, value: number): void {
            // ── Mesh ───────────────────────────────────────────────────────────
            const mesh = MeshBuilder.CreateCylinder(
                  `drop_${Date.now()}`,
                  { height: 0.35, diameter: 0.28, tessellation: 8 },
                  this._scene
            );
            mesh.position.copyFrom(worldPos);
            mesh.position.y += 0.18;

            const mat = new StandardMaterial(`dropMat_${Date.now()}`, this._scene);
            if (lootType === "gold") {
                  mat.diffuseColor = new Color3(0.80, 0.60, 0.08);
                  mat.emissiveColor = new Color3(0.65, 0.42, 0.00);
            } else if (lootType === "equipment") {
                  mat.diffuseColor = new Color3(0.20, 0.30, 0.85);
                  mat.emissiveColor = new Color3(0.10, 0.15, 0.65);
            } else {
                  mat.diffuseColor = new Color3(0.58, 0.18, 0.78);
                  mat.emissiveColor = new Color3(0.38, 0.08, 0.58);
            }
            mat.specularColor = new Color3(0.4, 0.35, 0.15);
            mesh.material = mat;

            // ── Particle glow trail ─────────────────────────────────────────
            let ps: GPUParticleSystem | ParticleSystem | null = null;
            try {
                  ps = new GPUParticleSystem(`dropPs_${Date.now()}`, { capacity: 20 }, this._scene);
            } catch {
                  ps = new ParticleSystem(`dropPs_${Date.now()}`, 20, this._scene);
            }
            if (ps) {
                  ps.particleTexture = this._sharedTex;
                  ps.emitter = mesh as unknown as Vector3;
                  ps.minEmitBox = new Vector3(-0.08, 0, -0.08);
                  ps.maxEmitBox = new Vector3(0.08, 0.2, 0.08);
                  ps.color1 = new Color4(1.0, 0.80, 0.15, 0.8);
                  ps.color2 = new Color4(0.8, 0.50, 0.00, 0.3);
                  ps.colorDead = new Color4(0, 0, 0, 0);
                  ps.direction1 = new Vector3(-0.2, 0.5, -0.2);
                  ps.direction2 = new Vector3(0.2, 1.2, 0.2);
                  ps.minSize = 0.04;
                  ps.maxSize = 0.14;
                  ps.minLifeTime = 0.35;
                  ps.maxLifeTime = 0.7;
                  ps.emitRate = 18;
                  ps.gravity = new Vector3(0, -0.5, 0);
                  ps.start();
            }

            this._drops.push({ mesh, mat, particles: ps, lootType, value, collectible: true, elapsed: 0 });
      }

      update(dt: number): void {
            const player = Registry.player;
            if (!player) return;
            const playerPos = player.position;

            for (let i = this._drops.length - 1; i >= 0; i--) {
                  const d = this._drops[i];
                  d.elapsed += dt;

                  // Rotate (golden glimmer)
                  d.mesh.rotation.y += 2.2 * dt;

                  // Magnetic pickup check: within 8m
                  const dx = playerPos.x - d.mesh.position.x;
                  const dz = playerPos.z - d.mesh.position.z;
                  const dist = Math.sqrt(dx * dx + dz * dz);

                  if (d.collectible && dist < 8) {
                        // Lerp toward player at high speed
                        const speed = Math.min(1, 0.12 / Math.max(0.01, dist)); // faster when closer
                        d.mesh.position = Vector3.Lerp(d.mesh.position, playerPos.clone().add(new Vector3(0, 0.3, 0)), speed * 8 * dt);

                        if (dist < 1.0) {
                              // Collected!
                              this._collect(d, i, player);
                              continue;
                        }
                  }
            }
      }

      private _collect(d: DropItemData, idx: number, player: { stats: { gold: number; hp: number; maxHp: number } }): void {
            if (d.lootType === "gold") {
                  player.stats.gold = (player.stats.gold ?? 0) + d.value;
            }
            // Stop and remove particles
            d.particles?.stop();
            setTimeout(() => { d.particles?.dispose(); }, 500);
            d.mat.dispose();
            d.mesh.dispose();
            this._drops.splice(idx, 1);
      }

      dispose(): void {
            for (const d of this._drops) {
                  d.particles?.stop();
                  d.particles?.dispose();
                  d.mat.dispose();
                  d.mesh.dispose();
            }
            this._drops = [];
            this._sharedTex.dispose();
      }
}
