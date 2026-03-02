import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { ElementSystem } from './ElementSystem';
import { type DamageType } from './FloatingDamage';
import type { PetSeries } from '../pets/PetData';

export interface DamageResult {
      damage: number;
      isCrit: boolean;
      type: DamageType;
      elementMod: number;
}

export interface SkillDef {
      id: string;
      name: string;
      type: 'attack' | 'heal' | 'buff' | 'debuff';
      mpCost: number;
      cooldown: number;
      multiplier: number;
      icon: string;
}

/** 12 base skill definitions */
export const SKILL_DEFS: SkillDef[] = [
      { id: 'slash', name: '斬擊', type: 'attack', mpCost: 0, cooldown: 1.2, multiplier: 1.0, icon: 'skill_slash.png' },
      { id: 'power_strike', name: '強力一擊', type: 'attack', mpCost: 8, cooldown: 3.0, multiplier: 1.8, icon: 'skill_power.png' },
      { id: 'whirlwind', name: '旋風斬', type: 'attack', mpCost: 15, cooldown: 5.0, multiplier: 2.2, icon: 'skill_whirlwind.png' },
      { id: 'fire_bolt', name: '火球術', type: 'attack', mpCost: 12, cooldown: 4.0, multiplier: 2.0, icon: 'skill_fireball.png' },
      { id: 'ice_shard', name: '冰晶術', type: 'attack', mpCost: 10, cooldown: 3.5, multiplier: 1.6, icon: 'skill_ice.png' },
      { id: 'thunder', name: '雷擊', type: 'attack', mpCost: 18, cooldown: 6.0, multiplier: 2.5, icon: 'skill_thunder.png' },
      { id: 'heal', name: '治療術', type: 'heal', mpCost: 15, cooldown: 8.0, multiplier: 1.5, icon: 'skill_heal.png' },
      { id: 'group_heal', name: '群體治癒', type: 'heal', mpCost: 25, cooldown: 12.0, multiplier: 1.2, icon: 'skill_groupheal.png' },
      { id: 'shield', name: '防護罩', type: 'buff', mpCost: 10, cooldown: 10.0, multiplier: 0.3, icon: 'skill_shield.png' },
      { id: 'berserk', name: '狂暴', type: 'buff', mpCost: 20, cooldown: 15.0, multiplier: 1.5, icon: 'skill_berserk.png' },
      { id: 'weaken', name: '弱化', type: 'debuff', mpCost: 12, cooldown: 8.0, multiplier: 0.7, icon: 'skill_weaken.png' },
      { id: 'poison', name: '毒霧', type: 'debuff', mpCost: 14, cooldown: 10.0, multiplier: 0.5, icon: 'skill_poison.png' },
];

/** Cooldown tracker for a single entity */
export interface SkillCooldown {
      skillId: string;
      remaining: number;
}

/** Auto-skill queue config for one entity (player or pet) */
export interface AutoSkillEntry {
      skillId: string;
      enabled: boolean;
}

/**
 * CombatSystem — damage calculation, target management, auto-skill engine.
 * No pet AI: pets follow player's selected target.
 */
export class CombatSystem {
      /** Currently selected target (monster root position) */
      private _targetPosition: Vector3 | null = null;
      private _targetId: string | null = null;

      /** Cooldown trackers per entity */
      private _cooldowns = new Map<string, SkillCooldown[]>();

      /** Auto-skill queues per entity */
      private _autoQueues = new Map<string, AutoSkillEntry[]>();
      private _autoEnabled = new Map<string, boolean>();

      constructor() {
            // Initialize player auto-skill with default slash
            this.setAutoQueue('player', [{ skillId: 'slash', enabled: true }]);
      }

      // ── Target Management ──

      selectTarget(targetId: string, position: Vector3): void {
            this._targetId = targetId;
            this._targetPosition = position.clone();
      }

      clearTarget(): void {
            this._targetId = null;
            this._targetPosition = null;
      }

      get targetId(): string | null { return this._targetId; }
      get targetPosition(): Vector3 | null { return this._targetPosition; }
      get hasTarget(): boolean { return this._targetId !== null; }

      // ── Damage Calculation ──

      /**
       * Calculate damage with formula:
       * damage = (atk * skillMultiplier - def * 0.5) * elementMod * (0.9 + random * 0.2)
       * Crit: 10% chance × 1.5
       */
      calculateDamage(
            atk: number,
            def: number,
            skillMultiplier: number,
            attackerSeries: PetSeries,
            defenderSeries: PetSeries,
      ): DamageResult {
            const elementMod = ElementSystem.getModifier(attackerSeries, defenderSeries);
            const randomFactor = 0.9 + Math.random() * 0.2;
            let damage = Math.max(1, (atk * skillMultiplier - def * 0.5) * elementMod * randomFactor);
            let isCrit = false;

            // 10% crit chance
            if (Math.random() < 0.10) {
                  damage *= 1.5;
                  isCrit = true;
            }

            // Determine display type
            let type: DamageType = 'normal';
            if (isCrit) type = 'crit';
            else if (elementMod > 1.0) type = 'counter';
            else if (elementMod < 1.0) type = 'resisted';

            return { damage: Math.round(damage), isCrit, type, elementMod };
      }

      // ── Auto-Skill Queue ──

      setAutoQueue(entityId: string, queue: AutoSkillEntry[]): void {
            this._autoQueues.set(entityId, queue);
            if (!this._cooldowns.has(entityId)) {
                  this._cooldowns.set(entityId, []);
            }
      }

      setAutoEnabled(entityId: string, enabled: boolean): void {
            this._autoEnabled.set(entityId, enabled);
      }

      isAutoEnabled(entityId: string): boolean {
            return this._autoEnabled.get(entityId) ?? false;
      }

      /**
       * Tick auto-skill for an entity. Returns skill to cast, or null.
       * @param entityId unique entity identifier
       * @param currentMp available MP
       * @param currentHpPct HP percentage 0-1
       * @param dt delta time in seconds
       */
      tickAutoSkill(entityId: string, currentMp: number, currentHpPct: number, dt: number): SkillDef | null {
            if (!this._autoEnabled.get(entityId)) return null;

            // Update cooldowns
            const cds = this._cooldowns.get(entityId) ?? [];
            for (const cd of cds) {
                  cd.remaining = Math.max(0, cd.remaining - dt);
            }

            const queue = this._autoQueues.get(entityId);
            if (!queue) return null;

            // Priority override: heal if HP < 30%
            if (currentHpPct < 0.3) {
                  const healSkill = queue.find(e => e.enabled && SKILL_DEFS.find(s => s.id === e.skillId)?.type === 'heal');
                  if (healSkill) {
                        const def = SKILL_DEFS.find(s => s.id === healSkill.skillId)!;
                        if (this._canCast(entityId, def, currentMp)) {
                              this._startCooldown(entityId, def);
                              return def;
                        }
                  }
            }

            // Normal queue order
            for (const entry of queue) {
                  if (!entry.enabled) continue;
                  const def = SKILL_DEFS.find(s => s.id === entry.skillId);
                  if (!def) continue;
                  if (this._canCast(entityId, def, currentMp)) {
                        this._startCooldown(entityId, def);
                        return def;
                  }
            }

            return null;
      }

      private _canCast(entityId: string, skill: SkillDef, currentMp: number): boolean {
            if (currentMp < skill.mpCost) return false;
            const cds = this._cooldowns.get(entityId) ?? [];
            const cd = cds.find(c => c.skillId === skill.id);
            return !cd || cd.remaining <= 0;
      }

      private _startCooldown(entityId: string, skill: SkillDef): void {
            let cds = this._cooldowns.get(entityId);
            if (!cds) {
                  cds = [];
                  this._cooldowns.set(entityId, cds);
            }
            const existing = cds.find(c => c.skillId === skill.id);
            if (existing) {
                  existing.remaining = skill.cooldown;
            } else {
                  cds.push({ skillId: skill.id, remaining: skill.cooldown });
            }
      }

      /** Get remaining cooldown for a skill */
      getCooldown(entityId: string, skillId: string): number {
            const cds = this._cooldowns.get(entityId) ?? [];
            return cds.find(c => c.skillId === skillId)?.remaining ?? 0;
      }

      dispose(): void {
            this._cooldowns.clear();
            this._autoQueues.clear();
            this._autoEnabled.clear();
      }
}
