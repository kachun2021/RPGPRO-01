import { Scene } from "@babylonjs/core/scene";
import { Vector3, Vector2 } from "@babylonjs/core/Maths/math";
import { Observable } from "@babylonjs/core/Misc/observable";
import { MonsterManager } from "../entities/MonsterManager";
import { Monster, MonsterState } from "../entities/Monster";
import { Player, PlayerStats } from "../entities/Player";
import { DropItem, DropReward } from "../entities/DropItem";
import { PickupParticles } from "../particles/PickupParticles";
import { SkillSystem } from "./SkillSystem";
import { FloatingDamage } from "./FloatingDamage";

export interface DamageEvent {
      target: "player" | "monster";
      amount: number;
      position: Vector3;
}

/**
 * CombatSystem — Damage, drops, and Auto-Battle AI
 */
export class CombatSystem {
      public readonly onDamageDealt = new Observable<DamageEvent>();
      public readonly onItemCollected = new Observable<DropReward>();

      // Auto-battle
      public autoBattle = false;
      public readonly onAutoBattleChanged = new Observable<boolean>();

      private scene: Scene;
      private monsterManager: MonsterManager;
      private player: Player;
      private pickupParticles: PickupParticles;
      public skillSystem: SkillSystem;
      private floatingDmg: FloatingDamage;

      // Active drop items
      private drops: DropItem[] = [];

      // Monster attack cooldown (prevent spam)
      private monsterAttackCooldowns = new Map<Monster, number>();

      // Auto-battle state
      private autoAttackTimer = 0;

      // Combat stats
      private totalDamageDealt = 0;
      private totalGoldCollected = 0;
      private totalExpCollected = 0;

      constructor(scene: Scene, monsterManager: MonsterManager, player: Player) {
            this.scene = scene;
            this.monsterManager = monsterManager;
            this.player = player;
            this.pickupParticles = new PickupParticles(scene);
            this.skillSystem = new SkillSystem(scene, player, monsterManager);
            this.floatingDmg = new FloatingDamage(scene);

            // Listen for monster deaths → spawn drops
            this.monsterManager.onMonsterDeath.add(({ monster, position }) => {
                  this.spawnDrops(position, monster.stats.goldDrop, monster.stats.expDrop);
            });

            console.log("[CombatSystem] Initialized with SkillSystem + Auto-Battle ✓");
      }

      public toggleAutoBattle(): void {
            this.autoBattle = !this.autoBattle;
            this.onAutoBattleChanged.notifyObservers(this.autoBattle);
            console.log(`[Combat] Auto-Battle: ${this.autoBattle ? "ON" : "OFF"}`);
      }

      // ═══════════════════════════════════════════════════════════════
      // ── PLAYER → MONSTER ATTACKS ──────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      /**
       * Called when player performs a swipe attack (legacy, kept for swipe gesture)
       */
      public processSwipeAttack(playerPos: Vector3, swipeDir: Vector2, range: number = 4): void {
            // Use normal ATK skill via swipe
            this.skillSystem.useSkill("atk");
      }

      // ═══════════════════════════════════════════════════════════════
      // ── MONSTER → PLAYER ATTACKS ──────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      public processMonsterAttacks(dt: number): void {
            // Skip if player is dodging (i-frames)
            if (this.skillSystem.isDodging()) return;

            const playerPos = this.player.getPosition();
            const activeMonsters = this.monsterManager.getActiveMonsters();

            for (const monster of activeMonsters) {
                  let cd = this.monsterAttackCooldowns.get(monster) || 0;
                  cd -= dt;
                  this.monsterAttackCooldowns.set(monster, cd);

                  if (monster.isAttacking() && cd <= 0) {
                        const dist = Vector3.Distance(monster.getPosition(), playerPos);
                        if (dist < monster.stats.attackRange) {
                              const damage = this.calculateDamage(monster.stats.atk, this.player.getStats().def);
                              this.player.takeDamage(damage);

                              this.pickupParticles.emitHitBurst(playerPos.add(new Vector3(0, 1, 0)));
                              this.floatingDmg.spawn(
                                    playerPos.add(new Vector3(0, 2.5, 0)),
                                    damage, "player"
                              );

                              this.onDamageDealt.notifyObservers({
                                    target: "player", amount: damage, position: playerPos
                              });

                              this.monsterAttackCooldowns.set(monster, 1.5);
                        }
                  }
            }

            // Clean up disposed monsters
            for (const [m] of this.monsterAttackCooldowns) {
                  if (m.isDead()) this.monsterAttackCooldowns.delete(m);
            }
      }

      // ═══════════════════════════════════════════════════════════════
      // ── AUTO-BATTLE AI ────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private updateAutoBattle(dt: number): void {
            if (!this.autoBattle) return;

            const playerPos = this.player.getPosition();
            const stats = this.player.getStats();

            // Auto-dodge if HP < 30%
            if (stats.hp < stats.maxHp * 0.3) {
                  const dodgeState = this.skillSystem.getSkillState("dodge");
                  if (dodgeState.ready) {
                        this.skillSystem.useSkill("dodge");
                        return;
                  }
            }

            // Find nearest monster
            const monsters = this.monsterManager.getActiveMonsters();
            if (monsters.length === 0) return;

            let nearest: Monster | null = null;
            let nearestDist = Infinity;
            for (const m of monsters) {
                  const d = Vector3.Distance(playerPos, m.getPosition());
                  if (d < nearestDist) {
                        nearestDist = d;
                        nearest = m;
                  }
            }

            if (!nearest) return;

            // If monster out of ATK range, auto-move toward it
            if (nearestDist > 3.5) {
                  const dir = nearest.getPosition().subtract(playerPos);
                  dir.y = 0;
                  dir.normalize();
                  const speed = 5;
                  this.player.root.position.addInPlace(dir.scale(speed * dt));
                  this.player.setMoving(true);

                  // Face toward monster
                  const angle = Math.atan2(dir.x, dir.z);
                  this.player.root.rotation.y = angle;
            } else {
                  this.player.setMoving(false);

                  // Use best available skill
                  this.autoAttackTimer -= dt;
                  if (this.autoAttackTimer <= 0) {
                        const bestSkill = this.skillSystem.getBestAvailableSkill();
                        if (bestSkill) {
                              this.skillSystem.useSkill(bestSkill);
                              // Small delay between auto-attacks for visual clarity
                              this.autoAttackTimer = bestSkill === "atk" ? 0.6 : 0.3;
                        }
                  }
            }
      }

      // ═══════════════════════════════════════════════════════════════
      // ── DROP SYSTEM ───────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private spawnDrops(position: Vector3, goldAmount: number, expAmount: number): void {
            const goldCount = 2 + Math.floor(Math.random() * 3);
            const goldPer = Math.floor(goldAmount / goldCount);

            for (let i = 0; i < goldCount; i++) {
                  const offset = new Vector3(
                        (Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2
                  );
                  const drop = new DropItem(this.scene, position.add(offset), {
                        type: "gold", amount: goldPer
                  });
                  drop.onCollect.add((reward) => {
                        this.collectReward(reward, drop.getPosition());
                  });
                  this.drops.push(drop);
            }

            const expDrop = new DropItem(this.scene, position.add(new Vector3(0, 0.5, 0)), {
                  type: "exp", amount: expAmount
            });
            expDrop.onCollect.add((reward) => {
                  this.collectReward(reward, expDrop.getPosition());
            });
            this.drops.push(expDrop);

            if (Math.random() < 0.3) {
                  const hpDrop = new DropItem(this.scene, position.add(new Vector3(1, 0, 0)), {
                        type: "hp", amount: 50
                  });
                  hpDrop.onCollect.add((reward) => {
                        this.collectReward(reward, hpDrop.getPosition());
                  });
                  this.drops.push(hpDrop);
            }

            console.log(`[CombatSystem] Spawned ${goldCount} gold + 1 exp drops`);
      }

      private collectReward(reward: DropReward, position: Vector3): void {
            switch (reward.type) {
                  case "gold":
                        this.player.addGold(reward.amount);
                        this.pickupParticles.emitGoldBurst(position);
                        this.totalGoldCollected += reward.amount;
                        break;
                  case "exp":
                        this.player.addExp(reward.amount);
                        this.pickupParticles.emitExpBurst(position);
                        this.totalExpCollected += reward.amount;
                        break;
                  case "hp":
                        this.player.heal(reward.amount);
                        this.pickupParticles.emitHPBurst(position);
                        break;
            }
            this.onItemCollected.notifyObservers(reward);
      }

      // ═══════════════════════════════════════════════════════════════
      // ── UPDATE LOOP ───────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      public update(dt: number): void {
            const playerPos = this.player.getPosition();

            // Update skill system cooldowns
            this.skillSystem.update(dt);

            // Process monster attacks → player
            this.processMonsterAttacks(dt);

            // Auto-battle AI
            this.updateAutoBattle(dt);

            // Update drops (pickup detection)
            for (let i = this.drops.length - 1; i >= 0; i--) {
                  const drop = this.drops[i];
                  if (drop.disposed) {
                        this.drops.splice(i, 1);
                        continue;
                  }
                  drop.update(dt, playerPos);
            }
      }

      private calculateDamage(atk: number, def: number): number {
            const reduction = def / (def + 100);
            const baseDmg = atk * (1 - reduction);
            const variance = 0.9 + Math.random() * 0.2;
            return Math.max(1, Math.round(baseDmg * variance));
      }

      public dispose(): void {
            this.drops.forEach(d => d.dispose());
            this.drops = [];
            this.onDamageDealt.clear();
            this.onItemCollected.clear();
            this.onAutoBattleChanged.clear();
            this.skillSystem.dispose();
      }
}
