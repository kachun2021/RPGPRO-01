import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { Registry } from "../core/Registry";

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
      private _speed = 6;

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
            // Root pivot
            this.root = MeshBuilder.CreateCapsule("playerBody", {
                  height: 1.6, radius: 0.3, tessellation: 12, subdivisions: 1,
            }, this._scene);
            this.root.position.y = 0.8;

            const mat = new StandardMaterial("playerMat", this._scene);
            mat.diffuseColor = new Color3(0.15, 0.05, 0.35);
            mat.emissiveColor = new Color3(0.48, 0.25, 0.89); // #7B3FE4 微光
            mat.specularColor = Color3.Black();
            this.root.material = mat;

            // Head
            this._head = MeshBuilder.CreateSphere("playerHead", {
                  diameter: 0.5, segments: 8,
            }, this._scene);
            this._head.position.y = 1.2;
            this._head.parent = this.root;
            this._head.material = mat;

            // Metadata for asset replacement
            this.root.metadata = { isPlaceholder: true, specId: "player_model" };
      }

      // ── Movement (called from joystick / WASD) ─────────
      setMoveDirection(dir: Vector3): void {
            this._moveDir = dir;
            if (dir.lengthSquared() > 0.01 && this._state === this.idleState) {
                  this.switchState(this.manualState);
            } else if (dir.lengthSquared() < 0.01 && this._state === this.manualState) {
                  this.switchState(this.idleState);
            }
      }

      applyMovement(dt: number): void {
            if (this._moveDir.lengthSquared() < 0.01) return;
            const move = this._moveDir.normalize().scale(this._speed * dt);
            this.root.position.addInPlace(move);
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
            this._state.update(this, dt);
      }

      dispose(): void {
            this._head?.dispose();
            this.root?.dispose();
      }
}
