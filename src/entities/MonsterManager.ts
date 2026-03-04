import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { Monster, type MonsterDef } from './Monster';
import { PetSeries } from '../pets/PetData';
import { getZoneDef } from '../world/ZoneDefinitions';
import { ZONE_MONSTER_DATA, type ZoneMonsterEntry } from '../world/ZoneMonsterData';

export interface ZoneMonsterConfig {
      zoneId: string;
      monsters: MonsterDef[];
      maxActive: number;
}

/** Callback for monster damage to player */
export type OnMonsterDamage = (damage: number, monsterName: string) => void;

/**
 * Heuristic: assign PetSeries based on Chinese monster name keywords.
 * Fallback to Beast for unmatched names.
 */
function guessSeriesFromName(name: string): PetSeries {
      if (/龍|龙|飛天|飞天/.test(name)) return PetSeries.Dragon;
      if (/蟲|虫|蜂|蝶|蛛|蝠|蜻|蝎|蝇|螳|甲|蛾|蚊|蜗|蝸/.test(name)) return PetSeries.Insect;
      if (/狗|犬|兔|猫|貓|狐|狮|獅|牛|馬|马|象|犀|熊|鹿|豬|猪|考拉|猴/.test(name)) return PetSeries.Beast;
      if (/鳥|鸟|鷹|鹰|鸚|鹦|鴿|鸽|鳳|凤|鹈|雞|鸡|企鵝|鹫/.test(name)) return PetSeries.Bird;
      if (/草|葉|叶|花|木|樹|树|藤|蘑|菇|菜|蔬|蘋|苹|椰/.test(name)) return PetSeries.Plant;
      if (/鬼|魔|暗|惡|恶|靈|灵|幽|骷|髅|骨|死|冥/.test(name)) return PetSeries.Demon;
      if (/金|鐵|铁|鋼|钢|機|机|齒|齿|輪|轮|盾|劍|剑|坦/.test(name)) return PetSeries.Metal;
      if (/晶|水|冰|雪|月|星|光|神|聖|圣|仙|妖/.test(name)) return PetSeries.Mystery;
      return PetSeries.Beast;
}

/**
 * Build MonsterDef array from ZoneMonsterData for a given zone.
 */
function buildDefsForZone(zoneId: string): MonsterDef[] {
      const zoneDef = getZoneDef(zoneId);
      if (!zoneDef || zoneDef.isTown) return [];

      const mapMonIds = zoneDef.mapMonIds;
      if (!mapMonIds || mapMonIds.length === 0) return [];

      const defs: MonsterDef[] = [];
      let idx = 0;
      for (const mapId of mapMonIds) {
            const entries = ZONE_MONSTER_DATA[mapId];
            if (!entries) continue;
            for (const entry of entries) {
                  const isBoss = entry.isBoss || entry.respawnSec >= 3600;
                  const series = guessSeriesFromName(entry.name);
                  defs.push({
                        id: `mon_${zoneId}_${idx++}`,
                        name: entry.name,
                        level: entry.level,
                        series,
                        behavior: entry.mode === '主动式' ? 'aggressive' : 'passive',
                        respawnSec: entry.respawnSec,
                        isBoss,
                        maxHp: Math.round(entry.level * 12 * (isBoss ? 5 : 1)),
                        atk: Math.round(entry.level * 2.5),
                        def: Math.round(entry.level * 1.2),
                        eggDropRate: isBoss ? 0.05 : 0.001,
                  });
            }
      }
      return defs;
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

            // Dynamically build monster defs from ZoneMonsterData
            this._config.monsters = buildDefsForZone(this._config.zoneId);

            const defs = this._config.monsters.filter(m => !m.isBoss);
            const spawnCount = Math.min(defs.length, this._config.maxActive);

            for (let i = 0; i < spawnCount; i++) {
                  const def = defs[i % defs.length];
                  this._spawnMonster(def, this._randomPosition());
            }

            // Spawn all bosses
            const bossDefs = this._config.monsters.filter(m => m.isBoss);
            for (const bossDef of bossDefs) {
                  const bossPos = new Vector3(
                        (Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40,
                  );
                  this._spawnMonster(bossDef, bossPos);
                  this._showBossAlert(bossDef.name, bossDef.level);
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
                              const respawnSec = m.def.isBoss ? Math.max(3600, m.def.respawnSec) : m.def.respawnSec;
                              this._respawnTimers.push({ def: m.def, remaining: respawnSec });
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
