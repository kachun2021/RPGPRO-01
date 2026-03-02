import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { Monster, type MonsterDef } from './Monster';
import { PetSeries } from '../pets/PetData';

export interface ZoneMonsterConfig {
      zoneId: string;
      monsters: MonsterDef[];
      maxActive: number;
}

const STARTER_MONSTERS: MonsterDef[] = [
      { id: 'mon_draco', name: 'Draco', level: 1, series: PetSeries.Dragon, behavior: 'passive', respawnSec: 60, isBoss: false, maxHp: 50, atk: 5, def: 2, eggDropRate: 0.001, eggPetId: 'd_draco' },
      { id: 'mon_blackball', name: 'Devilco', level: 1, series: PetSeries.Demon, behavior: 'passive', respawnSec: 60, isBoss: false, maxHp: 45, atk: 6, def: 1, eggDropRate: 0.001, eggPetId: 'e_devilco' },
      { id: 'mon_amber', name: 'Inseco', level: 1, series: PetSeries.Insect, behavior: 'passive', respawnSec: 60, isBoss: false, maxHp: 40, atk: 4, def: 3, eggDropRate: 0.001, eggPetId: 'i_inseco' },
      { id: 'mon_ruru', name: 'Rurabbi', level: 3, series: PetSeries.Demon, behavior: 'passive', respawnSec: 60, isBoss: false, maxHp: 55, atk: 7, def: 2, eggDropRate: 0.001, eggPetId: 'e_rurabbi' },
      { id: 'mon_rabbo', name: 'Rabbo', level: 3, series: PetSeries.Beast, behavior: 'passive', respawnSec: 60, isBoss: false, maxHp: 60, atk: 8, def: 3, eggDropRate: 0.001, eggPetId: 'b_rabbo' },
      { id: 'mon_spike', name: 'Manglock', level: 3, series: PetSeries.Plant, behavior: 'passive', respawnSec: 60, isBoss: false, maxHp: 58, atk: 7, def: 4, eggDropRate: 0.001, eggPetId: 'p_manglock' },
      { id: 'mon_angelbee', name: 'Pee', level: 3, series: PetSeries.Insect, behavior: 'passive', respawnSec: 60, isBoss: false, maxHp: 48, atk: 6, def: 2, eggDropRate: 0.001, eggPetId: 'i_pee' },
      { id: 'mon_apple', name: 'Flowco', level: 1, series: PetSeries.Plant, behavior: 'passive', respawnSec: 60, isBoss: false, maxHp: 52, atk: 5, def: 3, eggDropRate: 0.001, eggPetId: 'p_flowco' },
      { id: 'mon_fivetail', name: 'FiveTailFox', level: 10, series: PetSeries.Mystery, behavior: 'aggressive', respawnSec: 3600, isBoss: true, maxHp: 500, atk: 25, def: 10, eggDropRate: 0.05, eggPetId: 'y_mysco' },
];

/** Callback for monster damage to player */
export type OnMonsterDamage = (damage: number, monsterName: string) => void;

export class MonsterManager {
      private _scene: Scene;
      private _shadowGen: ShadowGenerator;
      private _monsters: Monster[] = [];
      private _config: ZoneMonsterConfig;
      private _spawnTimers = new Map<string, number>();

      /** Called when a monster deals damage to the player */
      public onDamagePlayer: OnMonsterDamage | null = null;

      constructor(scene: Scene, shadowGen: ShadowGenerator) {
            this._scene = scene;
            this._shadowGen = shadowGen;
            this._config = {
                  zoneId: 'starter_meadow',
                  monsters: STARTER_MONSTERS,
                  maxActive: 10,
            };
      }

      spawnForZone(_zoneId?: string): void {
            this.despawnAll();
            const defs = this._config.monsters.filter(m => !m.isBoss);
            const spawnCount = Math.min(defs.length, this._config.maxActive);

            for (let i = 0; i < spawnCount; i++) {
                  const def = defs[i % defs.length];
                  this._spawnMonster(def, this._randomPosition());
            }

            const bossDef = this._config.monsters.find(m => m.isBoss);
            if (bossDef) {
                  const bossPos = new Vector3(
                        (Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40,
                  );
                  this._spawnMonster(bossDef, bossPos);
                  this._showBossAlert(bossDef.name, bossDef.level);
            }
      }

      private _spawnMonster(def: MonsterDef, pos: Vector3): Monster {
            const monster = new Monster(this._scene, def, pos, this._shadowGen);
            this._monsters.push(monster);
            return monster;
      }

      private _randomPosition(): Vector3 {
            return new Vector3(
                  (Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30,
            );
      }

      private _showBossAlert(name: string, level: number): void {
            const alert = document.createElement('div');
            alert.className = 'boss-alert';
            alert.textContent = 'Boss! ' + name + ' Lv.' + level;
            document.getElementById('ui-layer')?.appendChild(alert);
            setTimeout(() => alert.remove(), 4000);
      }

      get alive(): Monster[] {
            return this._monsters.filter(m => !m.isDead);
      }

      get all(): Monster[] {
            return this._monsters;
      }

      findClosest(pos: Vector3): Monster | null {
            let closest: Monster | null = null;
            let minDist = Infinity;
            for (const m of this.alive) {
                  const d = m.distanceTo(pos);
                  if (d < minDist) { minDist = d; closest = m; }
            }
            return closest;
      }

      update(dt: number, playerPos: Vector3): void {
            const engine = this._scene.getEngine();
            const cam = this._scene.activeCamera;
            const rw = engine.getRenderWidth();
            const rh = engine.getRenderHeight();

            for (let i = this._monsters.length - 1; i >= 0; i--) {
                  const m = this._monsters[i];

                  if (m.isDead) {
                        const done = m.updateDeath(dt);
                        if (done) {
                              const respawnId = m.def.id + '_' + Date.now();
                              this._spawnTimers.set(respawnId, m.def.respawnSec);
                              m.dispose();
                              this._monsters.splice(i, 1);
                        }
                  } else {
                        // Monster AI: wander + aggro + attack player
                        const dmg = m.updateAI(dt, playerPos);
                        if (dmg > 0 && this.onDamagePlayer) {
                              this.onDamagePlayer(dmg, m.def.name);
                        }

                        // Project HP bar to screen — use Identity matrix since position is world-space
                        if (cam) {
                              const worldPos = m.root.position.add(new Vector3(0, 1.2, 0));
                              const viewport = cam.viewport.toGlobal(rw, rh);
                              const screenPos = Vector3.Project(
                                    worldPos,
                                    Matrix.IdentityReadOnly,
                                    this._scene.getTransformMatrix(),
                                    viewport,
                              );
                              // Only show if in front of camera (z < 1)
                              if (screenPos.z > 0 && screenPos.z < 1) {
                                    m.updateUI(screenPos.x, screenPos.y);
                              } else {
                                    m.updateUI(-999, -999); // hide off-screen
                              }
                        }
                  }
            }

            // Process respawn timers
            for (const [key, remaining] of this._spawnTimers) {
                  const newVal = remaining - dt;
                  if (newVal <= 0) {
                        this._spawnTimers.delete(key);
                        const defs = this._config.monsters;
                        const def = defs[Math.floor(Math.random() * defs.length)];
                        this._spawnMonster(def, this._randomPosition());
                        if (def.isBoss) this._showBossAlert(def.name, def.level);
                  } else {
                        this._spawnTimers.set(key, newVal);
                  }
            }
      }

      despawnAll(): void {
            for (const m of this._monsters) m.dispose();
            this._monsters.length = 0;
            this._spawnTimers.clear();
      }

      dispose(): void {
            this.despawnAll();
      }
}
