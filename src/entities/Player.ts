import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';

export interface PlayerStats {
      hp: number; maxHp: number;
      mp: number; maxMp: number;
      atk: number; def: number;
      level: number; exp: number;
      gold: number; diamond: number;
      questChapter: number;
}

export type PlayerExpToNextResolver = (level: number) => number;
export type PlayerLevelUpListener = (newLevel: number) => void;

interface PlayerRuntimeOptions {
      expToNextResolver?: PlayerExpToNextResolver;
      initialStats?: Partial<PlayerStats>;
}

export class Player {
      public root: TransformNode;
      public mesh!: Mesh;
      public stats: PlayerStats;
      public speed = 6.0;

      private _scene: Scene;
      private _moveDirection = Vector3.Zero();
      private _moveStrength = 0;
      private _expToNextResolver: PlayerExpToNextResolver | null = null;
      private _levelUpListeners: PlayerLevelUpListener[] = [];

      /** Combat: walk toward this target position */
      public combatTarget: Vector3 | null = null;

      constructor(scene: Scene, shadowGenerator: ShadowGenerator, runtime?: PlayerRuntimeOptions) {
            this._scene = scene;
            this._expToNextResolver = runtime?.expToNextResolver ?? null;

            // Root node
            this.root = new TransformNode('player_root', scene);
            this.root.position = new Vector3(0, 0, 0);

            // Body capsule (normal human proportion, 1.8 unit tall)
            const body = MeshBuilder.CreateCapsule('player_body', {
                  height: 1.4,
                  radius: 0.25,
            }, scene);
            body.position.y = 0.9;
            body.parent = this.root;

            // Head sphere
            const head = MeshBuilder.CreateSphere('player_head', {
                  diameter: 0.4,
                  segments: 12,
            }, scene);
            head.position.y = 1.75;
            head.parent = this.root;

            // PBR material - deep blue armor
            const mat = new PBRMaterial('playerMat', scene);
            mat.albedoColor = new Color3(0.3, 0.35, 0.5);
            mat.roughness = 0.6;
            mat.metallic = 0.3;
            mat.emissiveColor = new Color3(0.05, 0.08, 0.15);
            mat.directIntensity = 1.5;
            mat.ambientColor = new Color3(0.2, 0.2, 0.3);
            body.material = mat;
            head.material = mat;

            // Shadow
            shadowGenerator.addShadowCaster(body);
            shadowGenerator.addShadowCaster(head);
            body.receiveShadows = true;

            this.mesh = body;

            // Default stats
            this.stats = {
                  hp: 100, maxHp: 100,
                  mp: 50, maxMp: 50,
                  atk: 10, def: 5,
                  level: 1, exp: 0,
                  gold: 500, diamond: 10,
                  questChapter: 0,
            };
            if (runtime?.initialStats) {
                  this.stats = {
                        ...this.stats,
                        ...runtime.initialStats,
                  };
            }
      }

      get position(): Vector3 {
            return this.root.position;
      }

      setMoveDirection(dir: Vector3): void {
            const strength = Math.min(1, dir.length());
            if (strength > 0.01) {
                  this._moveDirection.copyFrom(dir.scale(1 / strength));
                  this._moveStrength = strength;
            } else {
                  this._moveDirection.set(0, 0, 0);
                  this._moveStrength = 0;
            }
      }

      update(dt: number): void {
            let moveDir = this._moveDirection.clone();

            // Combat target: walk toward monster if no joystick input
            if (this.combatTarget && moveDir.lengthSquared() < 0.01) {
                  const toTarget = this.combatTarget.subtract(this.root.position);
                  toTarget.y = 0;
                  if (toTarget.length() > 1.0) {
                        moveDir = toTarget.normalizeToNew();
                        this._moveStrength = 1;
                  }
            }

            if (moveDir.lengthSquared() > 0.01) {
                  const move = moveDir.normalizeToNew().scale(this.speed * Math.max(0.2, this._moveStrength) * dt);
                  this.root.position.addInPlace(move);

                  // Rotate to face movement direction
                  const angle = Math.atan2(moveDir.x, moveDir.z);
                  this.root.rotation.y = angle;
            }
      }

      /** EXP required for next level */
      get expToNext(): number {
            const level = Math.max(1, Math.floor(this.stats.level));
            if (this._expToNextResolver) {
                  const value = this._expToNextResolver(level);
                  if (Number.isFinite(value) && value > 0) return Math.floor(value);
            }
            return level * 100;
      }

      setExpCurveResolver(resolver: PlayerExpToNextResolver | null): void {
            this._expToNextResolver = resolver;
      }

      onLevelUp(listener: PlayerLevelUpListener): () => void {
            this._levelUpListeners.push(listener);
            return () => {
                  const idx = this._levelUpListeners.indexOf(listener);
                  if (idx >= 0) this._levelUpListeners.splice(idx, 1);
            };
      }

      /** Add EXP and auto level-up. Returns { levelsGained } */
      addExp(amount: number): { levelsGained: number } {
            let levelsGained = 0;
            this.stats.exp += amount;

            while (true) {
                  const need = this.expToNext;
                  if (this.stats.exp < need) break;
                  this.stats.exp -= need;
                  this.stats.level++;
                  levelsGained++;

                  // Base stat growth per level
                  this.stats.maxHp += 12;
                  this.stats.maxMp += 6;
                  this.stats.atk += 2;
                  this.stats.def += 1;

                  // Full heal on level-up
                  this.stats.hp = this.stats.maxHp;
                  this.stats.mp = this.stats.maxMp;

                  console.log(`[Player] Level Up! -> Lv.${this.stats.level}`);
                  for (const handler of this._levelUpListeners) {
                        try {
                              handler(this.stats.level);
                        } catch {
                              // Keep level-up flow resilient even if UI listeners fail.
                        }
                  }
            }

            return { levelsGained };
      }

      dispose(): void {
            this.root.dispose(false, true);
      }
}
