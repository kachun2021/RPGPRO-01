import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Monster } from "./Monster";

/**
 * MonsterManager — Spawns and manages monster pool
 * Max 8 active monsters, respawn every 5 seconds
 */
export class MonsterManager {
      public readonly onMonsterDeath = new Observable<{ monster: Monster; position: Vector3 }>();

      private scene: Scene;
      private monsters: Monster[] = [];
      private maxMonsters = 8;
      private spawnTimer = 2; // first spawn after 2s
      private spawnInterval = 5;
      private spawnRadiusMin = 15;
      private spawnRadiusMax = 30;
      private killCount = 0;

      constructor(scene: Scene) {
            this.scene = scene;

      }

      public update(dt: number, playerPos: Vector3): void {
            // Spawn check
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0 && this.monsters.length < this.maxMonsters) {
                  this.spawnMonster(playerPos);
                  this.spawnTimer = this.spawnInterval;
            }

            // Update all monsters
            for (let i = this.monsters.length - 1; i >= 0; i--) {
                  const m = this.monsters[i];
                  if (m.disposed) {
                        this.monsters.splice(i, 1);
                        continue;
                  }
                  m.update(dt, playerPos);
            }
      }

      private spawnMonster(playerPos: Vector3): void {
            const angle = Math.random() * Math.PI * 2;
            const dist = this.spawnRadiusMin + Math.random() * (this.spawnRadiusMax - this.spawnRadiusMin);
            const spawnPos = new Vector3(
                  playerPos.x + Math.cos(angle) * dist,
                  0,
                  playerPos.z + Math.sin(angle) * dist
            );

            // Random type based on kill count (harder monsters spawn later)
            let typeIdx = 0;
            if (this.killCount > 5) typeIdx = Math.random() < 0.5 ? 1 : 0;
            if (this.killCount > 15) typeIdx = Math.floor(Math.random() * 3);

            const monster = new Monster(this.scene, spawnPos, typeIdx);
            monster.onDeath.add((m) => {
                  this.killCount++;
                  this.onMonsterDeath.notifyObservers({
                        monster: m,
                        position: m.getPosition()
                  });

            });

            this.monsters.push(monster);

      }

      /**
       * Get all monsters within range of a position (for combat hit detection)
       */
      public getMonstersInRange(pos: Vector3, radius: number): Monster[] {
            return this.monsters.filter(m => {
                  if (m.isDead()) return false;
                  return Vector3.Distance(m.getPosition(), pos) <= radius;
            });
      }

      public getActiveMonsters(): Monster[] {
            return this.monsters.filter(m => !m.isDead());
      }

      public getKillCount(): number {
            return this.killCount;
      }

      public dispose(): void {
            this.monsters.forEach(m => m.dispose());
            this.monsters = [];
            this.onMonsterDeath.clear();
      }
}
