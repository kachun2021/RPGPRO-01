import type { Scene } from "@babylonjs/core/scene";
import { Monster } from "./Monster";
import { Registry } from "../core/Registry";
import { TerrainGenerator } from "../world/TerrainGenerator";
import { DropSystem } from "./DropItem";
import { FloatingDamage } from "../combat/FloatingDamage";
import type { CombatSystem } from "../combat/CombatSystem";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

const MAX_MONSTERS = 15;   // world monster count limit (performance)
const SPAWN_RADIUS_MIN = 25;
const SPAWN_RADIUS_MAX = 90;
const RESPAWN_DELAY = 12;   // seconds

interface RespawnEntry {
      timer: number;
      level: number;
}

/**
 * MonsterManager — spawn pool, respawn scheduling, update loop.
 * Integrates: Monster AI, FloatingDamage, DropSystem.
 */
export class MonsterManager {
      private _scene: Scene;
      private _monsters: Monster[] = [];
      private _respawns: RespawnEntry[] = [];
      private _dropSys: DropSystem;
      private _floatDmg: FloatingDamage;
      private _combat?: CombatSystem;
      private _initialized = false;

      constructor(scene: Scene, dropSys: DropSystem, floatDmg: FloatingDamage) {
            this._scene = scene;
            this._dropSys = dropSys;
            this._floatDmg = floatDmg;
            Registry.monsters = this._monsters;
            Registry.monsterManager = this;
      }

      setCombatSystem(cs: CombatSystem): void { this._combat = cs; }

      /** Call once after player is ready */
      initialSpawn(): void {
            if (this._initialized) return;
            this._initialized = true;
            for (let i = 0; i < 8; i++) this._spawnMonster();
      }

      private _spawnMonster(): void {
            if (this._monsters.length >= MAX_MONSTERS) return;
            const player = Registry.player;
            const baseLevel = Registry.player?.stats?.level ?? 1;

            // Determine spawn position
            const angle = Math.random() * Math.PI * 2;
            const dist = SPAWN_RADIUS_MIN + Math.random() * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN);
            const spawnX = (player?.position.x ?? 0) + Math.cos(angle) * dist;
            const spawnZ = (player?.position.z ?? 0) + Math.sin(angle) * dist;
            const spawnY = TerrainGenerator.getHeightAt(spawnX, spawnZ);

            // Zone-matching level variation
            const level = Math.max(1, baseLevel + Math.floor(Math.random() * 3 - 1));

            const m = new Monster(this._scene, level);
            m.setPosition(spawnX, spawnY, spawnZ);

            m.onDeath = (dead) => {
                  // Floating damage final is handled per-hit; here we drop loot
                  const dropCount = 1 + Math.floor(Math.random() * 2);
                  for (let i = 0; i < dropCount; i++) {
                        const goldAmt = 5 + dead.level * 3 + Math.floor(Math.random() * 10);
                        const offset = new Vector3(
                              (Math.random() - 0.5) * 1.5,
                              0.1,
                              (Math.random() - 0.5) * 1.5
                        );
                        this._dropSys.spawnDrop(dead.root.position.add(offset), "gold", goldAmt);
                  }
                  // Small chance for equipment drop
                  if (Math.random() < 0.08) {
                        this._dropSys.spawnDrop(dead.root.position, "equipment", dead.level);
                  }
                  // Schedule respawn
                  this._respawns.push({ timer: RESPAWN_DELAY, level });
                  // Remove from active list
                  const idx = this._monsters.indexOf(dead);
                  if (idx !== -1) this._monsters.splice(idx, 1);
            };

            this._monsters.push(m);
      }

      update(dt: number): void {
            // Update monsters
            for (const m of this._monsters) m.update(dt);

            // Respawn scheduler
            for (let i = this._respawns.length - 1; i >= 0; i--) {
                  this._respawns[i].timer -= dt;
                  if (this._respawns[i].timer <= 0) {
                        this._respawns.splice(i, 1);
                        this._spawnMonster();
                  }
            }

            // Ensure minimum population
            if (this._monsters.length < 5 && this._respawns.length === 0) {
                  this._spawnMonster();
            }
      }

      dispose(): void {
            for (const m of this._monsters) {
                  m.root?.dispose();
            }
            this._monsters = [];
            this._dropSys.dispose();
      }
}
