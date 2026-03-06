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

/** Runtime-aligned skill definitions (31 entries) */
export const SKILL_DEFS: SkillDef[] = [
      { id: 'slash', name: '強擊術', type: 'attack', mpCost: 0, cooldown: 1.2, multiplier: 1.0, icon: 'skill_slash.png' },
      { id: 'power_strike', name: '強力一擊', type: 'attack', mpCost: 8, cooldown: 3.0, multiplier: 1.8, icon: 'skill_power.png' },
      { id: 'whirlwind', name: '速攻術', type: 'attack', mpCost: 15, cooldown: 5.0, multiplier: 2.2, icon: 'skill_whirlwind.png' },
      { id: 'fire_bolt', name: '火球術', type: 'attack', mpCost: 12, cooldown: 4.0, multiplier: 2.0, icon: 'skill_fireball.png' },
      { id: 'ice_shard', name: '冰封術', type: 'attack', mpCost: 10, cooldown: 3.5, multiplier: 1.6, icon: 'skill_ice.png' },
      { id: 'thunder', name: '爆裂火焰', type: 'attack', mpCost: 18, cooldown: 6.0, multiplier: 2.5, icon: 'skill_thunder.png' },
      { id: 'heal', name: '治癒術', type: 'heal', mpCost: 15, cooldown: 8.0, multiplier: 1.5, icon: 'skill_heal.png' },
      { id: 'group_heal', name: '群體治療術', type: 'heal', mpCost: 25, cooldown: 12.0, multiplier: 1.2, icon: 'skill_groupheal.png' },
      { id: 'shield', name: '遮蔽術', type: 'buff', mpCost: 10, cooldown: 10.0, multiplier: 0.3, icon: 'skill_shield.png' },
      { id: 'berserk', name: '大地之力', type: 'buff', mpCost: 20, cooldown: 15.0, multiplier: 1.5, icon: 'skill_berserk.png' },
      { id: 'weaken', name: '虛弱術', type: 'debuff', mpCost: 12, cooldown: 8.0, multiplier: 0.7, icon: 'skill_weaken.png' },
      { id: 'poison', name: '施毒術', type: 'debuff', mpCost: 14, cooldown: 10.0, multiplier: 0.5, icon: 'skill_poison.png' },
      { id: 'evade', name: '迴避術', type: 'buff', mpCost: 8, cooldown: 6.0, multiplier: 0.6, icon: 'skill_shield.png' },
      { id: 'counter', name: '反擊術', type: 'attack', mpCost: 8, cooldown: 4.0, multiplier: 1.4, icon: 'skill_power.png' },
      { id: 'stun', name: '昏迷術', type: 'debuff', mpCost: 12, cooldown: 7.0, multiplier: 1.0, icon: 'skill_weaken.png' },
      { id: 'steal', name: '搶奪術', type: 'attack', mpCost: 9, cooldown: 6.0, multiplier: 1.1, icon: 'skill_slash.png' },
      { id: 'bind', name: '束縛術', type: 'debuff', mpCost: 11, cooldown: 8.0, multiplier: 0.9, icon: 'skill_ice.png' },
      { id: 'aoe_stun', name: '群體昏迷術', type: 'debuff', mpCost: 20, cooldown: 12.0, multiplier: 1.1, icon: 'skill_thunder.png' },
      { id: 'power_strike_alt', name: '強擊術(進階)', type: 'attack', mpCost: 14, cooldown: 3.5, multiplier: 2.0, icon: 'skill_power.png' },
      { id: 'stun_alt', name: '昏迷術(進階)', type: 'debuff', mpCost: 16, cooldown: 8.5, multiplier: 1.1, icon: 'skill_weaken.png' },
      { id: 'steal_alt', name: '搶奪術(進階)', type: 'attack', mpCost: 12, cooldown: 7.0, multiplier: 1.2, icon: 'skill_slash.png' },
      { id: 'heal_alt', name: '治癒術(進階)', type: 'heal', mpCost: 18, cooldown: 9.0, multiplier: 1.7, icon: 'skill_heal.png' },
      { id: 'shield_alt', name: '遮蔽術(進階)', type: 'buff', mpCost: 14, cooldown: 11.0, multiplier: 0.45, icon: 'skill_shield.png' },
      { id: 'fire_bolt_alt', name: '火球術(進階)', type: 'attack', mpCost: 16, cooldown: 4.5, multiplier: 2.2, icon: 'skill_fireball.png' },
      { id: 'weaken_alt', name: '虛弱術(進階)', type: 'debuff', mpCost: 14, cooldown: 9.0, multiplier: 0.85, icon: 'skill_weaken.png' },
      { id: 'thunder_alt', name: '爆裂火焰(進階)', type: 'attack', mpCost: 22, cooldown: 7.0, multiplier: 2.8, icon: 'skill_thunder.png' },
      { id: 'fire_poison', name: '火毒術', type: 'debuff', mpCost: 16, cooldown: 10.0, multiplier: 1.0, icon: 'skill_fireball.png' },
      { id: 'detox', name: '解毒術', type: 'heal', mpCost: 12, cooldown: 7.0, multiplier: 1.1, icon: 'skill_groupheal.png' },
      { id: 'thorns', name: '荊棘術', type: 'buff', mpCost: 18, cooldown: 12.0, multiplier: 1.1, icon: 'skill_berserk.png' },
      { id: 'haste', name: '急行術', type: 'buff', mpCost: 14, cooldown: 9.0, multiplier: 1.2, icon: 'skill_whirlwind.png' },
      { id: 'group_detox', name: '群體解毒術', type: 'heal', mpCost: 22, cooldown: 13.0, multiplier: 1.3, icon: 'skill_groupheal.png' },
      { id: 'group_poison', name: '群體施毒術', type: 'debuff', mpCost: 20, cooldown: 12.0, multiplier: 0.9, icon: 'skill_poison.png' },
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
 * CombatSystem 鈥?damage calculation, target management, auto-skill engine.
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
      private _queueCursor = new Map<string, number>();

      constructor() {
            // Initialize player auto-skill with default slash
            this.setAutoQueue('player', [{ skillId: 'slash', enabled: true }]);
      }

      // 鈹€鈹€ Target Management 鈹€鈹€

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

      // 鈹€鈹€ Damage Calculation 鈹€鈹€

      /**
       * Calculate damage with formula:
       * damage = (atk * skillMultiplier - def * 0.5) * elementMod * (0.9 + random * 0.2)
       * Crit: 10% chance 脳 1.5
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

      // 鈹€鈹€ Auto-Skill Queue 鈹€鈹€

      setAutoQueue(entityId: string, queue: AutoSkillEntry[]): void {
            this._autoQueues.set(entityId, [...queue]);
            if (!this._cooldowns.has(entityId)) {
                  this._cooldowns.set(entityId, []);
            }
            const current = this._queueCursor.get(entityId) ?? 0;
            this._queueCursor.set(entityId, queue.length > 0 ? current % queue.length : 0);
      }

      getAutoQueue(entityId: string): AutoSkillEntry[] {
            return [...(this._autoQueues.get(entityId) ?? [])];
      }

      /** Move queue cursor to a specific slot */
      setQueueCursor(entityId: string, cursor: number): void {
            const queue = this._autoQueues.get(entityId) ?? [];
            if (queue.length === 0) {
                  this._queueCursor.set(entityId, 0);
                  return;
            }
            this._queueCursor.set(entityId, ((cursor % queue.length) + queue.length) % queue.length);
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
            this.tickCooldowns(entityId, dt);

            const queue = this._autoQueues.get(entityId);
            if (!queue || queue.length === 0) return null;

            // Priority override: heal if HP < 30%
            if (currentHpPct < 0.3) {
                  const healSkill = queue.find(e => e.enabled && SKILL_DEFS.find(s => s.id === e.skillId)?.type === 'heal');
                  if (healSkill) {
                        const def = SKILL_DEFS.find(s => s.id === healSkill.skillId)!;
                        if (this.canCastSkill(entityId, def.id, currentMp, def.mpCost)) {
                              this.startCooldown(entityId, def.id, def.cooldown);
                              const healIdx = queue.findIndex(e => e.skillId === healSkill.skillId);
                              this._advanceCursor(entityId, healIdx, queue.length);
                              return def;
                        }
                  }
            }

            // Strict queue-top check: only inspect current cursor
            const cursor = this._queueCursor.get(entityId) ?? 0;
            const entry = queue[cursor];
            if (!entry?.enabled) return null;
            const def = SKILL_DEFS.find(s => s.id === entry.skillId);
            if (!def) return null;
            if (!this.canCastSkill(entityId, def.id, currentMp, def.mpCost)) return null;
            this.startCooldown(entityId, def.id, def.cooldown);
            this._advanceCursor(entityId, cursor, queue.length);
            return def;

      }

      /** Get remaining cooldown for a skill */
      getCooldown(entityId: string, skillId: string): number {
            const cds = this._cooldowns.get(entityId) ?? [];
            return cds.find(c => c.skillId === skillId)?.remaining ?? 0;
      }

      tickCooldowns(entityId: string, dt: number): void {
            const cds = this._cooldowns.get(entityId) ?? [];
            for (const cd of cds) {
                  cd.remaining = Math.max(0, cd.remaining - dt);
            }
      }

      tickAllCooldowns(dt: number): void {
            for (const entityId of this._cooldowns.keys()) {
                  this.tickCooldowns(entityId, dt);
            }
      }

      canCastSkill(entityId: string, skillId: string, currentMp: number, mpCost: number): boolean {
            if (currentMp < mpCost) return false;
            return this.getCooldown(entityId, skillId) <= 0;
      }

      startCooldown(entityId: string, skillId: string, duration: number): void {
            let cds = this._cooldowns.get(entityId);
            if (!cds) {
                  cds = [];
                  this._cooldowns.set(entityId, cds);
            }
            const existing = cds.find(c => c.skillId === skillId);
            if (existing) {
                  existing.remaining = duration;
            } else {
                  cds.push({ skillId, remaining: duration });
            }
      }

      private _advanceCursor(entityId: string, currentIndex: number, queueLength: number): void {
            if (queueLength <= 0) {
                  this._queueCursor.set(entityId, 0);
                  return;
            }
            this._queueCursor.set(entityId, (currentIndex + 1) % queueLength);
      }

      dispose(): void {
            this._cooldowns.clear();
            this._autoQueues.clear();
            this._autoEnabled.clear();
            this._queueCursor.clear();
      }
}

