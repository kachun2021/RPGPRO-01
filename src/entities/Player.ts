import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { Registry } from "../core/Registry";
import { TerrainGenerator } from "../world/TerrainGenerator";

// ── Interfaces ──────────────────────────────────────────────────────────────
export interface PlayerStats {
      hp: number;
      maxHp: number;
      mp: number;
      maxMp: number;
      atk: number;
      def: number;
      level: number;
      exp: number;
      expToNext: number;
      gold: number;
      diamond: number;
      totalKills: number;
}

export interface IPlayerState {
      enter(player: Player): void;
      update(player: Player, dt: number): void;
      exit(player: Player): void;
}

// ── States (skeleton — P6 implements fully) ──────────────────────────────────
class IdleState implements IPlayerState {
      enter() { /* noop */ }
      update(_p: Player, _dt: number) { /* noop */ }
      exit() { /* noop */ }
}

class AutoGrindState implements IPlayerState {
      enter() { /* noop — P6 adds auto AI */ }
      update(_p: Player, _dt: number) { /* P6 */ }
      exit() { /* noop */ }
}

class ManualOverrideState implements IPlayerState {
      enter() { /* noop */ }
      update(player: Player, dt: number) {
            player.applyMovement(dt);
      }
      exit() { /* noop */ }
}

// ── Player ──────────────────────────────────────────────────────────────────
export class Player {
      readonly stats: PlayerStats = {
            hp: 100, maxHp: 100,
            mp: 50, maxMp: 50,
            atk: 12, def: 5,
            level: 1, exp: 0, expToNext: 100,
            gold: 0, diamond: 0,
            totalKills: 0,
      };

      readonly tempLoot: Array<{ id: string; name: string; rarity: string }> = [];

      root!: Mesh;
      private _body!: Mesh;
      private _head!: Mesh;
      private _scene: Scene;
      private _moveDir = Vector3.Zero();
      private _speed = 10; // 提升：6→9km/s — 適合幾百米級大世界探索

      // ── State machine ───────
      private _state: IPlayerState;
      readonly idleState = new IdleState();
      readonly autoGrindState = new AutoGrindState();
      readonly manualState = new ManualOverrideState();

      constructor(scene: Scene) {
            this._scene = scene;
            this._state = this.idleState;
            this._buildPlaceholder();
            Registry.player = this;
      }

      private _buildPlaceholder(): void {
            // ── Root pivot (Capsule body) ────────────────────
            this.root = MeshBuilder.CreateCapsule("playerBody", {
                  height: 1.8, radius: 0.35, tessellation: 14, subdivisions: 1,
            }, this._scene);

            // ✅ 修復：起始 Y 位置考慮地形高度
            const startTerrainY = TerrainGenerator.getHeightAt(0, 0);
            this.root.position.y = startTerrainY + 0.9; // capsule half-height

            const mat = new StandardMaterial("playerMat", this._scene);
            mat.diffuseColor = new Color3(0.18, 0.06, 0.40);   // 深紫色身體
            mat.emissiveColor = new Color3(0.55, 0.22, 1.0);   // 強化 emissive — 暴敎紫光！
            mat.specularColor = new Color3(0.3, 0.2, 0.6);     // 增加閃亮感
            this.root.material = mat;

            // Head
            this._head = MeshBuilder.CreateSphere("playerHead", {
                  diameter: 0.55, segments: 8,
            }, this._scene);
            this._head.position.y = 1.1; // relative to root capsule center
            this._head.parent = this.root;

            const headMat = new StandardMaterial("playerHeadMat", this._scene);
            headMat.diffuseColor = new Color3(0.22, 0.09, 0.45);
            headMat.emissiveColor = new Color3(0.6, 0.25, 1.0); // 頭部更亮光灕
            headMat.specularColor = new Color3(0.4, 0.25, 0.7);
            this._head.material = headMat;

            // Metadata for asset replacement
            this.root.metadata = { isPlaceholder: true, specId: "player_model" };
      }

      // ── Movement (called every frame from MainScene render loop) ─────────
      /** Set move direction from joystick/WASD — called every frame from MainScene */
      setMoveDirection(dir: Vector3): void {
            this._moveDir.copyFrom(dir);
      }

      applyMovement(dt: number): void {
            if (this._moveDir.lengthSquared() < 0.01) return;
            const move = this._moveDir.normalize().scale(this._speed * dt);
            this.root.position.x += move.x;
            this.root.position.z += move.z;

            // ✅ 修復：增量重調 Y 高度跟隨地形
            const terrainY = TerrainGenerator.getHeightAt(this.root.position.x, this.root.position.z);
            this.root.position.y = terrainY + 0.9; // capsule half-height offset

            // Face movement direction
            const angle = Math.atan2(this._moveDir.x, this._moveDir.z);
            this.root.rotation.y = angle;
      }

      get position(): Vector3 {
            return this.root.position;
      }

      // ── State machine ─────────────────
      switchState(newState: IPlayerState): void {
            this._state.exit(this);
            this._state = newState;
            this._state.enter(this);
      }

      // ── Exp/Level (P6 完善) ───────────
      addExp(amount: number): void {
            this.stats.exp += amount;
            while (this.stats.exp >= this.stats.expToNext) {
                  this.stats.exp -= this.stats.expToNext;
                  this.stats.level++;
                  this.stats.expToNext = Math.floor(this.stats.expToNext * 1.5);
                  this.stats.maxHp += 15;
                  this.stats.hp = this.stats.maxHp;
                  this.stats.maxMp += 8;
                  this.stats.mp = this.stats.maxMp;
                  this.stats.atk += 3;
                  this.stats.def += 2;
                  // TODO: P6 LevelUpEffect
            }
      }

      // ── Update loop ─────────────────────
      update(dt: number): void {
            // ✅ 修復：移動直接在 update() 執行，不再待 state machine 切換
            // State machine 保留給 P6 Auto-Grind AI 使用
            if (this._moveDir.lengthSquared() > 0.01) {
                  this.applyMovement(dt);
            }
            // Also call state update (for P6 AI systems, currently noop)
            this._state.update(this, dt);
      }

      dispose(): void {
            this._head?.dispose();
            this.root?.dispose();
      }
}
