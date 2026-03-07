import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { Scene } from '@babylonjs/core/scene';
import { getRuntimeMonstersForSceneZone } from '../data/runtime/RuntimeMonsterSource';
import { getRuntimeSceneZone } from '../world/RuntimeZoneCatalog';
import { Monster, type MonsterDef } from './Monster';

export interface ZoneMonsterConfig {
      zoneId: string;
      monsters: MonsterDef[];
      maxActive: number;
}

/** Callback for monster damage to player */
export type OnMonsterDamage = (damage: number, monsterName: string) => void;

function buildDefsForZone(zoneId: string): MonsterDef[] {
      const zoneDef = getRuntimeSceneZone(zoneId);
      if (!zoneDef || zoneDef.isTown) return [];

      const runtimeRows = getRuntimeMonstersForSceneZone(zoneId);
      const defs: MonsterDef[] = [];

      for (let i = 0; i < runtimeRows.length; i++) {
            const row = runtimeRows[i];
            defs.push({
                  id: `mon_${zoneId}_${row.monsterType}_${i}`,
                  name: row.name,
                  sourceMonsterType: row.monsterType,
                  sourceMobIdx: row.sourceMobIdx,
                  mobItemIdx: row.mobItemIdx,
                  level: row.level,
                  series: row.series,
                  behavior: row.behavior,
                  respawnSec: row.respawnSec,
                  isBoss: row.isBoss,
                  maxHp: row.maxHp,
                  atk: row.atk,
                  def: row.def,
                  eggDropRate: row.eggDropRate,
                  spawnWeight: row.spawnWeight,
            });
      }

      return defs;
}

function weightedPick(defs: MonsterDef[]): MonsterDef {
      if (defs.length <= 1) return defs[0];
      let total = 0;
      for (const def of defs) total += Math.max(1, def.spawnWeight ?? 1);
      if (total <= 0) return defs[Math.floor(Math.random() * defs.length)];
      let roll = Math.random() * total;
      for (const def of defs) {
            roll -= Math.max(1, def.spawnWeight ?? 1);
            if (roll <= 0) return def;
      }
      return defs[defs.length - 1];
}

function resolveMaxActive(zoneId: string, defs: MonsterDef[]): number {
      const zoneDef = getRuntimeSceneZone(zoneId);
      if (!zoneDef || zoneDef.isTown) return 0;

      let baseline = 10;
      if (zoneDef.levelMax >= 120) baseline = 14;
      else if (zoneDef.levelMax >= 60) baseline = 12;

      const normalCount = defs.filter(def => !def.isBoss).length;
      if (normalCount <= 0) return 0;
      return Math.max(6, Math.min(18, Math.max(baseline, Math.floor(normalCount * 0.3))));
}

export class MonsterManager {
      private _scene: Scene;
      private _shadowGen: ShadowGenerator;
      private _monsters: Monster[] = [];
      private _config: ZoneMonsterConfig;
      private _respawnTimers: Array<{ def: MonsterDef; remaining: number }> = [];

      /** Called when a monster deals damage to the player */
      public onDamagePlayer: OnMonsterDamage | null = null;

      constructor(scene: Scene, shadowGen: ShadowGenerator) {
            this._scene = scene;
            this._shadowGen = shadowGen;
            this._config = {
                  zoneId: 'starter_meadow',
                  monsters: [],
                  maxActive: 10,
            };
      }

      spawnForZone(zoneId?: string): void {
            if (zoneId) {
                  this._config.zoneId = zoneId;
            }
            this.despawnAll();

            this._config.monsters = buildDefsForZone(this._config.zoneId);
            this._config.maxActive = resolveMaxActive(this._config.zoneId, this._config.monsters);

            const normalDefs = this._config.monsters.filter(mon => !mon.isBoss);
            const bossDefs = this._config.monsters
                  .filter(mon => mon.isBoss)
                  .sort((a, b) => b.level - a.level)
                  .slice(0, 2);

            for (let i = 0; i < this._config.maxActive; i++) {
                  if (normalDefs.length === 0) break;
                  const picked = weightedPick(normalDefs);
                  this._spawnMonster(picked, this._randomPosition());
            }

            for (const bossDef of bossDefs) {
                  const bossPos = new Vector3(
                        (Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40,
                  );
                  this._spawnMonster(bossDef, bossPos);
                  this._showBossAlert(bossDef.name, bossDef.level);
            }

            if (this._config.monsters.length === 0) {
                  const zoneDef = getRuntimeSceneZone(this._config.zoneId);
                  if (!zoneDef?.isTown) {
                        console.warn(`[MonsterManager] no runtime monster pool for zone: ${this._config.zoneId}`);
                  }
            }

            console.log(`[MonsterManager] Spawned ${this._monsters.length} monsters for zone: ${this._config.zoneId}`);
      }

      private _spawnMonster(def: MonsterDef, pos: Vector3): Monster {
            const monster = new Monster(this._scene, def, pos, this._shadowGen);
            this._monsters.push(monster);
            return monster;
      }

      private _randomPosition(): Vector3 {
            return new Vector3(
                  (Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60,
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

      get currentZoneId(): string {
            return this._config.zoneId;
      }

      findClosest(pos: Vector3): Monster | null {
            let closest: Monster | null = null;
            let minDist = Infinity;
            for (const m of this._monsters) {
                  if (m.isDead) continue;
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
                              const minRespawn = m.def.isBoss ? 300 : 8;
                              this._respawnTimers.push({ def: m.def, remaining: Math.max(minRespawn, m.def.respawnSec) });
                              m.dispose();
                              this._monsters.splice(i, 1);
                        }
                  } else {
                        const dmg = m.updateAI(dt, playerPos);
                        if (dmg > 0 && this.onDamagePlayer) {
                              this.onDamagePlayer(dmg, m.def.name);
                        }

                        if (cam) {
                              const worldPos = m.root.position.add(new Vector3(0, 1.2, 0));
                              const viewport = cam.viewport.toGlobal(rw, rh);
                              const screenPos = Vector3.Project(
                                    worldPos,
                                    Matrix.IdentityReadOnly,
                                    this._scene.getTransformMatrix(),
                                    viewport,
                              );
                              if (screenPos.z > 0 && screenPos.z < 1) {
                                    m.updateUI(screenPos.x, screenPos.y);
                              } else {
                                    m.updateUI(-999, -999);
                              }
                        }
                  }
            }

            for (let i = this._respawnTimers.length - 1; i >= 0; i--) {
                  const t = this._respawnTimers[i];
                  t.remaining -= dt;
                  if (t.remaining > 0) continue;
                  this._spawnMonster(t.def, this._randomPosition());
                  if (t.def.isBoss) this._showBossAlert(t.def.name, t.def.level);
                  this._respawnTimers.splice(i, 1);
            }
      }

      despawnAll(): void {
            for (const m of this._monsters) m.dispose();
            this._monsters.length = 0;
            this._respawnTimers.length = 0;
      }

      dispose(): void {
            this.despawnAll();
      }
}
