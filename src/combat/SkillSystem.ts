import { Scene } from "@babylonjs/core/scene";
import { Vector3, Vector2 } from "@babylonjs/core/Maths/math";
import { Observable } from "@babylonjs/core/Misc/observable";
import { MonsterManager } from "../entities/MonsterManager";
import { Player } from "../entities/Player";
import { SkillVFX } from "../particles/SkillVFX";
import { FloatingDamage } from "./FloatingDamage";

// ── Skill Definitions ───────────────────────────────────────────
export interface SkillDef {
      id: string;
      name: string;
      icon: string;
      cooldown: number;       // seconds
      mpCost: number;
      damageMultiplier: number;
      range: number;
      isAOE: boolean;
      vfxType: "slash" | "dash" | "lightning" | "frost" | "explosion";
}

export interface SkillState {
      ready: boolean;
      cooldownRemaining: number;
      cooldownTotal: number;
}

export interface SkillUseEvent {
      skillId: string;
      damage: number;
      hitCount: number;
}

const SKILL_DEFS: SkillDef[] = [
      { id: "atk", name: "Normal ATK", icon: "⚔️", cooldown: 0.5, mpCost: 0, damageMultiplier: 1.0, range: 4, isAOE: false, vfxType: "slash" },
      { id: "dodge", name: "Dodge", icon: "💨", cooldown: 3, mpCost: 20, damageMultiplier: 0, range: 0, isAOE: false, vfxType: "dash" },
      { id: "skill1", name: "Storm Strike", icon: "⚡", cooldown: 5, mpCost: 40, damageMultiplier: 2.5, range: 6, isAOE: false, vfxType: "lightning" },
      { id: "skill2", name: "Frost Nova", icon: "❄️", cooldown: 8, mpCost: 60, damageMultiplier: 3.0, range: 8, isAOE: true, vfxType: "frost" },
      { id: "ult", name: "Cataclysm", icon: "💥", cooldown: 25, mpCost: 100, damageMultiplier: 8.0, range: 12, isAOE: true, vfxType: "explosion" },
];

/**
 * SkillSystem — Manages skills, cooldowns, MP costs, damage application
 */
export class SkillSystem {
      public readonly onSkillUsed = new Observable<SkillUseEvent>();

      private scene: Scene;
      private player: Player;
      private monsterManager: MonsterManager;
      private vfx: SkillVFX;
      private floatingDmg: FloatingDamage;

      private cooldowns = new Map<string, number>();
      private skillMap = new Map<string, SkillDef>();

      // Dodge i-frames
      private dodgeActive = false;
      private dodgeTimer = 0;
      private dodgeDuration = 0.4;

      constructor(scene: Scene, player: Player, monsterManager: MonsterManager) {
            this.scene = scene;
            this.player = player;
            this.monsterManager = monsterManager;
            this.vfx = new SkillVFX(scene);
            this.floatingDmg = new FloatingDamage(scene);

            for (const def of SKILL_DEFS) {
                  this.skillMap.set(def.id, def);
                  this.cooldowns.set(def.id, 0);
            }

            console.log("[SkillSystem] Initialized with 5 skills ✓");
      }

      // ═══════════════════════════════════════════════════════════════
      // ── USE SKILL ─────────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      public useSkill(skillId: string): boolean {
            const def = this.skillMap.get(skillId);
            if (!def) return false;

            // Check cooldown
            const cd = this.cooldowns.get(skillId) || 0;
            if (cd > 0) return false;

            // Check MP
            const stats = this.player.getStats();
            if (stats.mp < def.mpCost) return false;

            // Consume MP
            if (def.mpCost > 0) {
                  this.player.setStats({ mp: stats.mp - def.mpCost });
            }

            // Start cooldown
            this.cooldowns.set(skillId, def.cooldown);

            const playerPos = this.player.getPosition();

            // Handle dodge separately
            if (skillId === "dodge") {
                  this.activateDodge();
                  this.vfx.playEffect("dash", playerPos);
                  this.onSkillUsed.notifyObservers({ skillId, damage: 0, hitCount: 0 });
                  console.log(`[Skill] ${def.name} — dodge activated!`);
                  return true;
            }

            // Find targets
            const targets = this.monsterManager.getMonstersInRange(playerPos, def.range);
            const maxTargets = def.isAOE ? targets.length : Math.min(1, targets.length);

            let totalDmg = 0;
            let hitCount = 0;

            for (let i = 0; i < maxTargets; i++) {
                  const monster = targets[i];
                  const baseDmg = stats.atk * def.damageMultiplier;
                  const reduction = monster.stats.def / (monster.stats.def + 100);
                  const variance = 0.9 + Math.random() * 0.2;
                  const finalDmg = Math.max(1, Math.round(baseDmg * (1 - reduction) * variance));

                  // Critical hit (15% chance, 2× damage)
                  const isCrit = Math.random() < 0.15;
                  const dmg = isCrit ? finalDmg * 2 : finalDmg;

                  monster.takeDamage(dmg);
                  totalDmg += dmg;
                  hitCount++;

                  // Floating damage
                  const hitPos = monster.getPosition().add(new Vector3(
                        (Math.random() - 0.5) * 0.5, 2, (Math.random() - 0.5) * 0.5
                  ));
                  this.floatingDmg.spawn(hitPos, dmg, isCrit ? "crit" : "normal");
            }

            // Play VFX at player position
            this.vfx.playEffect(def.vfxType, playerPos);

            // Screen shake for ultimate
            if (skillId === "ult") {
                  this.screenShake(0.5, 0.3);
            }

            this.onSkillUsed.notifyObservers({ skillId, damage: totalDmg, hitCount });

            if (hitCount > 0) {
                  console.log(`[Skill] ${def.name} → ${hitCount} hits, ${totalDmg} total dmg`);
            } else {
                  console.log(`[Skill] ${def.name} — no targets in range`);
            }

            return true;
      }

      // ═══════════════════════════════════════════════════════════════
      // ── DODGE ─────────────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private activateDodge(): void {
            this.dodgeActive = true;
            this.dodgeTimer = this.dodgeDuration;
      }

      public isDodging(): boolean {
            return this.dodgeActive;
      }

      // ═══════════════════════════════════════════════════════════════
      // ── UPDATE ────────────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      public update(dt: number): void {
            // Tick cooldowns
            for (const [id, cd] of this.cooldowns) {
                  if (cd > 0) {
                        this.cooldowns.set(id, Math.max(0, cd - dt));
                  }
            }

            // Tick dodge
            if (this.dodgeActive) {
                  this.dodgeTimer -= dt;
                  if (this.dodgeTimer <= 0) {
                        this.dodgeActive = false;
                  }
            }

            // Update floating damage
            this.floatingDmg.update(dt);
      }

      public getSkillState(id: string): SkillState {
            const def = this.skillMap.get(id);
            if (!def) return { ready: false, cooldownRemaining: 0, cooldownTotal: 0 };
            const cd = this.cooldowns.get(id) || 0;
            return { ready: cd <= 0, cooldownRemaining: cd, cooldownTotal: def.cooldown };
      }

      public getSkillDef(id: string): SkillDef | undefined {
            return this.skillMap.get(id);
      }

      public getAllSkillIds(): string[] {
            return SKILL_DEFS.map(s => s.id);
      }

      /**
       * Get best available skill for auto-battle (priority: ult > skill2 > skill1 > atk)
       */
      public getBestAvailableSkill(): string | null {
            const priority = ["ult", "skill2", "skill1", "atk"];
            const stats = this.player.getStats();

            for (const id of priority) {
                  const def = this.skillMap.get(id)!;
                  const cd = this.cooldowns.get(id) || 0;
                  if (cd <= 0 && stats.mp >= def.mpCost) {
                        return id;
                  }
            }
            return null;
      }

      private screenShake(intensity: number, duration: number): void {
            const camera = this.scene.activeCamera;
            if (!camera) return;
            let elapsed = 0;
            const obs = this.scene.onBeforeRenderObservable.add(() => {
                  elapsed += this.scene.getEngine().getDeltaTime() / 1000;
                  if (elapsed >= duration) {
                        this.scene.onBeforeRenderObservable.remove(obs);
                        return;
                  }
                  const decay = 1 - elapsed / duration;
                  (camera as any).target.x += (Math.random() - 0.5) * intensity * decay;
                  (camera as any).target.z += (Math.random() - 0.5) * intensity * decay;
            });
      }

      public dispose(): void {
            this.onSkillUsed.clear();
            this.vfx.dispose();
      }
}
