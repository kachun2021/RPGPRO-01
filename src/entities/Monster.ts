import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { TerrainGenerator } from "../world/TerrainGenerator";
import { Registry } from "../core/Registry";
import type { Element } from "../combat/CombatSystem";

export type MonsterState = "idle" | "patrol" | "chase" | "attack" | "dead";

/**
 * Monster — placeholder enemy (box body + sphere head + red eyes).
 * HP: billboard DOM div projected from 3D.
 * Death: shrink + fade → dispose → trigger drop.
 */
export class Monster {
      readonly scene: Scene;
      root!: Mesh;
      private _body!: Mesh;
      private _head!: Mesh;

      // Combat
      readonly level: number;
      readonly maxHp: number;
      hp: number;
      readonly def: number;
      lastElement: Element = "none";

      // AI state
      state: MonsterState = "idle";
      private _patrolTarget = Vector3.Zero();
      private _patrolTimer = 0;
      private _attackTimer = 0;
      private _spawnPos = Vector3.Zero();
      isAlive = true;

      // Callbacks
      onDeath?: (monster: Monster) => void;

      // HP bar DOM element
      private _hpBar?: HTMLElement;
      private _hpFill?: HTMLElement;

      constructor(scene: Scene, level: number) {
            this._build(scene, level);
            this.scene = scene;
            this.level = level;
            this.maxHp = 40 + level * 18;
            this.hp = this.maxHp;
            this.def = Math.floor(level * 1.5);
            this._createHPBar();
      }

      private _build(scene: Scene, level: number): void {
            // ── Root container ────────────────────────────────────────────────
            this.root = MeshBuilder.CreateBox("monsterRoot", { size: 0.01 }, scene);
            this.root.isPickable = false;
            const rootMat = new StandardMaterial("mRootMat", scene);
            rootMat.alpha = 0;
            this.root.material = rootMat;

            // ── Body ──────────────────────────────────────────────────────────
            this._body = MeshBuilder.CreateBox("monsterBody", { width: 0.9, height: 1.2, depth: 0.65 }, scene);
            this._body.parent = this.root;
            this._body.position.y = 0.6;
            const bodyMat = new StandardMaterial("monsterBodyMat", scene);
            const tier = Math.min(1, (level - 1) / 30);
            bodyMat.diffuseColor = new Color3(0.12 + tier * 0.08, 0.05, 0.05);
            bodyMat.emissiveColor = new Color3(0.22 + tier * 0.12, 0.02, 0.03);
            bodyMat.specularColor = new Color3(0.3, 0.05, 0.05);
            this._body.material = bodyMat;

            // ── Head ──────────────────────────────────────────────────────────
            this._head = MeshBuilder.CreateSphere("monsterHead", { diameter: 0.62, segments: 6 }, scene);
            this._head.parent = this.root;
            this._head.position.y = 1.55;
            const headMat = new StandardMaterial("monsterHeadMat", scene);
            headMat.diffuseColor = new Color3(0.18, 0.06, 0.06);
            headMat.emissiveColor = new Color3(0.35, 0.04, 0.04);
            this._head.material = headMat;

            // ── Eyes (red emissive) ───────────────────────────────────────────
            for (const side of [-1, 1]) {
                  const eye = MeshBuilder.CreateSphere("monsterEye", { diameter: 0.14, segments: 4 }, scene);
                  eye.parent = this.root;
                  eye.position.set(side * 0.15, 1.58, 0.28);
                  const eyeMat = new StandardMaterial("monsterEyeMat", scene);
                  eyeMat.emissiveColor = new Color3(0.95, 0.12, 0.05);
                  eyeMat.disableLighting = true;
                  eye.material = eyeMat;
            }
      }

      // ── HP Bar (DOM) ────────────────────────────────────────────────────────
      private _createHPBar(): void {
            const bar = document.createElement("div");
            bar.style.cssText = `
                position: absolute;
                width: 52px;
                height: 6px;
                border-radius: 3px;
                background: rgba(0,0,0,0.55);
                border: 1px solid rgba(255,50,50,0.4);
                box-shadow: 0 0 6px rgba(200,30,30,0.3);
                pointer-events: none;
                z-index: 150;
                transform: translateX(-50%);
                display: none;
                overflow: hidden;
            `;
            const fill = document.createElement("div");
            fill.style.cssText = `
                height: 100%;
                width: 100%;
                background: linear-gradient(90deg, #CC2200, #FF4422);
                border-radius: 3px;
                transition: width 0.15s ease;
            `;
            bar.appendChild(fill);
            document.getElementById("ui-layer")?.appendChild(bar);
            this._hpBar = bar;
            this._hpFill = fill;
      }

      /** Project 3D position to screen for HP bar — robust cross-version implementation */
      updateHPBarPosition(): void {
            if (!this._hpBar || !this.isAlive) return;
            const cam = this.scene.activeCamera;
            const engine = this.scene.getEngine();
            if (!cam) return;

            try {
                  // ArcRotateCamera.getViewMatrix() always exists in Babylon 8
                  const viewMatrix = cam.getViewMatrix();
                  // @ts-ignore
                  const projMatrix = cam.getProjectionMatrix
                        // @ts-ignore
                        ? cam.getProjectionMatrix()
                        // @ts-ignore
                        : (cam._projectionMatrix ?? null);
                  if (!viewMatrix || !projMatrix) return;

                  const worldPos = this.root.position.clone();
                  worldPos.y += 2.4;

                  // Manual MVP transform
                  const { x: wx, y: wy, z: wz } = worldPos;
                  const v = viewMatrix.m;
                  const p = projMatrix.m;

                  // View transform
                  const vx = v[0] * wx + v[4] * wy + v[8] * wz + v[12];
                  const vy = v[1] * wx + v[5] * wy + v[9] * wz + v[13];
                  const vz = v[2] * wx + v[6] * wy + v[10] * wz + v[14];

                  // Projection transform
                  const cx = p[0] * vx + p[4] * vy + p[8] * vz + p[12];
                  const cy = p[1] * vx + p[5] * vy + p[9] * vz + p[13];
                  const cz = p[2] * vx + p[6] * vy + p[10] * vz + p[14];
                  const cw = p[3] * vx + p[7] * vy + p[11] * vz + p[15];

                  if (cw <= 0) { this._hpBar.style.display = "none"; return; }

                  const ndcX = cx / cw;
                  const ndcY = cy / cw;
                  const ndcZ = cz / cw;

                  if (ndcZ < -1 || ndcZ > 1) { this._hpBar.style.display = "none"; return; }

                  const w = engine.getRenderWidth();
                  const h = engine.getRenderHeight();
                  const sx = (ndcX + 1) * 0.5 * w;
                  const sy = (1 - ndcY) * 0.5 * h;

                  this._hpBar.style.display = "block";
                  this._hpBar.style.left = `${sx}px`;
                  this._hpBar.style.top = `${sy}px`;
            } catch {
                  this._hpBar.style.display = "none";
            }
      }


      // ── Combat ──────────────────────────────────────────────────────────────
      takeDamage(amount: number, _reactionLabel?: string): void {
            if (!this.isAlive) return;
            this.hp = Math.max(0, this.hp - amount);
            if (this._hpFill) {
                  this._hpFill.style.width = `${(this.hp / this.maxHp) * 100}%`;
            }
            if (this.hp <= 0) this._die();
      }

      private _die(): void {
            if (!this.isAlive) return;
            this.isAlive = false;
            this.state = "dead";
            this._hpBar && (this._hpBar.style.display = "none");

            // Death animation: scale to 0 over 500ms
            let elapsed = 0;
            const obs = this.scene.onBeforeRenderObservable.add(() => {
                  const dt = this.scene.getEngine().getDeltaTime() / 1000;
                  elapsed += dt;
                  const s = Math.max(0, 1 - elapsed / 0.5);
                  this.root.scaling.setAll(s);
                  if (elapsed >= 0.5) {
                        this.scene.onBeforeRenderObservable.remove(obs);
                        Registry.totalKills++;
                        this.onDeath?.(this);
                        this._dispose();
                  }
            });
      }

      // ── AI Update ───────────────────────────────────────────────────────────
      update(dt: number): void {
            if (!this.isAlive || !Registry.player) return;
            const player = Registry.player;
            const playerPos = player.position;
            const myPos = this.root.position;
            const distSq = () => {
                  const dx = playerPos.x - myPos.x;
                  const dz = playerPos.z - myPos.z;
                  return dx * dx + dz * dz;
            };

            switch (this.state) {
                  case "idle":
                        this._patrolTimer -= dt;
                        if (this._patrolTimer <= 0) {
                              this.state = "patrol";
                              const angle = Math.random() * Math.PI * 2;
                              const d = 8 + Math.random() * 10;
                              this._patrolTarget.set(
                                    this._spawnPos.x + Math.cos(angle) * d, 0,
                                    this._spawnPos.z + Math.sin(angle) * d
                              );
                              this._patrolTimer = 3 + Math.random() * 3;
                        }
                        if (distSq() < 400) this.state = "chase"; // 20m
                        break;

                  case "patrol":
                        this._moveToward(this._patrolTarget, 2.5, dt);
                        const toDst = Vector3.Distance(myPos, this._patrolTarget);
                        if (toDst < 1.5) this.state = "idle";
                        if (distSq() < 400) this.state = "chase";
                        break;

                  case "chase":
                        if (distSq() > 1600) { this.state = "idle"; break; } // 40m — give up
                        if (distSq() < 9) { this.state = "attack"; break; }  // 3m — attack range
                        this._moveToward(playerPos, 4.5, dt);
                        break;

                  case "attack":
                        this._attackTimer -= dt;
                        if (distSq() > 16) { this.state = "chase"; break; }
                        if (this._attackTimer <= 0) {
                              this._attackTimer = 1.8;
                              // Deal damage to player
                              if (player.stats) {
                                    const dmg = Math.max(1, this.level * 2 - player.stats.def);
                                    player.stats.hp = Math.max(0, player.stats.hp - dmg);
                              }
                        }
                        break;
            }

            // HP bar tracking
            this.updateHPBarPosition();
      }

      private _moveToward(target: Vector3, speed: number, dt: number): void {
            const dir = target.subtract(this.root.position);
            dir.y = 0;
            const len = dir.length();
            if (len < 0.5) return;
            dir.scaleInPlace(speed * dt / len);
            this.root.position.addInPlace(dir);
            // Terrain follow
            const gy = TerrainGenerator.getHeightAt(this.root.position.x, this.root.position.z);
            this.root.position.y = gy + 0.01;
            // Face direction
            this.root.rotation.y = Math.atan2(dir.x, dir.z);
      }

      setPosition(x: number, y: number, z: number): void {
            this.root.position.set(x, y, z);
            this._spawnPos.set(x, y, z);
      }

      private _dispose(): void {
            this._hpBar?.remove();
            this._body.material?.dispose();
            this._head.material?.dispose();
            if (!this.root.isDisposed()) this.root.dispose();
      }
}
