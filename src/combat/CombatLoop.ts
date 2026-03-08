import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { SKILL_DEFS, type CombatSystem, type SkillDef } from './CombatSystem';
import type { ProjectileSystem } from './ProjectileSystem';
import type { FloatingDamage } from './FloatingDamage';
import type { MonsterManager } from '../entities/MonsterManager';
import type { Monster } from '../entities/Monster';
import type { EggDropSystem } from '../systems/EggDropSystem';
import type { PetManager } from '../pets/PetManager';
import type { Pet } from '../pets/Pet';
import { PetSeries, type PetSkillDef } from '../pets/PetData';
import type { SkillBar } from '../ui/SkillBar';
import type { DropTable } from '../systems/DropTable';
import type { DropItemManager } from '../entities/DropItem';
import type { Inventory } from '../systems/Inventory';
import type { QuestManager } from '../systems/QuestManager';
import { Registry } from '../core/Registry';

interface PlayerQueueEntry {
      slotIdx: number;
      skill: SkillDef;
}

interface PetQueueEntry {
      slotIdx: number;
      pet: Pet;
      skill: PetSkillDef;
}

/**
 * CombatLoop orchestrates auto target + auto skill casting + death/drop flow.
 *
 * Key behavior for P1:
 * - Player uses strict queue-top casting (CD/MP not ready => wait, do not skip).
 * - Pets cast in strict team rotation (P1 -> wait CD -> P2 -> wait CD -> P3).
 * - HP < 30% gives heal-skill priority for player queue.
 */
export class CombatLoop {
      private _scene: Scene;
      private _combatSystem: CombatSystem;
      private _projectileSystem: ProjectileSystem;
      private _floatingDamage: FloatingDamage;
      private _monsterManager: MonsterManager;
      private _eggDropSystem: EggDropSystem;
      private _petManager: PetManager;
      private _skillBar: SkillBar | null = null;

      // P7: Drop system references
      private _dropTable: DropTable | null = null;
      private _dropItemManager: DropItemManager | null = null;
      private _inventory: Inventory | null = null;

      // P9: Quest tracking
      private _questManager: QuestManager | null = null;

      private _target: Monster | null = null;
      private _autoGrind = false;

      // Strict queue pointer for player and pets
      private _playerQueue: PlayerQueueEntry[] = [];
      private _playerNextIdx = 0;
      private _playerWaitCD = 0;

      private _petQueue: PetQueueEntry[] = [];
      private _petNextIdx = 0;
      private _petWaitCD = 0;

      // Retarget cooldown after kill (prevents stutter)
      private _retargetDelay = 0;
      private _autoConfigSyncCountdown = 0;
      private _autoConfigDirty = true;
      private _autoConfigSignature = '';
      private readonly AUTO_CONFIG_SYNC_INTERVAL = 0.25;

      // Player references
      private _getPlayerPos: () => Vector3;
      private _setPlayerTarget: (pos: Vector3 | null) => void;
      private _playerAtk: () => number;
      private _playerName: string;

      /** Melee attack range */
      private readonly MELEE_RANGE = 2.5;
      /** Auto-grind detection range (runtime configurable) */
      private _autoDetectRange = 20;
      /** Skip boss targets for low-risk AFK */
      private _skipBossTargets = false;
      /** Reacquire a nearby target after a manual kill */
      private _autoLockTarget = true;

      constructor(
            scene: Scene,
            combatSystem: CombatSystem,
            projectileSystem: ProjectileSystem,
            floatingDamage: FloatingDamage,
            monsterManager: MonsterManager,
            eggDropSystem: EggDropSystem,
            petManager: PetManager,
            getPlayerPos: () => Vector3,
            setPlayerTarget: (pos: Vector3 | null) => void,
            playerAtk: () => number,
            playerName: string,
      ) {
            this._scene = scene;
            this._combatSystem = combatSystem;
            this._projectileSystem = projectileSystem;
            this._floatingDamage = floatingDamage;
            this._monsterManager = monsterManager;
            this._eggDropSystem = eggDropSystem;
            this._petManager = petManager;
            this._getPlayerPos = getPlayerPos;
            this._setPlayerTarget = setPlayerTarget;
            this._playerAtk = playerAtk;
            this._playerName = playerName;

            this._setupPointerPick();
      }

      /** Connect SkillBar for CD visualization */
      setSkillBar(bar: SkillBar): void {
            this._skillBar = bar;
            this._autoConfigDirty = true;
            this._syncAutoSkillConfig(true);
      }

      /** P7: Connect drop system */
      setDropSystem(dropTable: DropTable, dropItemManager: DropItemManager, inventory: Inventory): void {
            this._dropTable = dropTable;
            this._dropItemManager = dropItemManager;
            this._inventory = inventory;
      }

      /** P9: Connect quest manager for kill tracking */
      setQuestManager(qm: QuestManager): void {
            this._questManager = qm;
      }

      // -- Pointer Pick --

      private _setupPointerPick(): void {
            this._scene.onPointerDown = (_evt, pickResult) => {
                  if (!pickResult?.hit || !pickResult.pickedMesh) return;
                  const meshName = pickResult.pickedMesh.name;
                  const parentName = pickResult.pickedMesh.parent?.name ?? '';

                  for (const m of this._monsterManager.alive) {
                        if (m.mesh.name === meshName || m.root.name === parentName) {
                              this.selectTarget(m);
                              return;
                        }
                  }
            };
      }

      selectTarget(monster: Monster): void {
            this._target = monster;
            this._combatSystem.selectTarget(monster.def.id, monster.root.position);
            this._setPlayerTarget(monster.root.position);
            console.log('[Combat] Target:', monster.def.name, 'Lv.' + monster.def.level);
      }

      clearTarget(): void {
            this._target = null;
            this._combatSystem.clearTarget();
            this._setPlayerTarget(null);
      }

      get target(): Monster | null { return this._target; }
      get isAutoGrind(): boolean { return this._autoGrind; }

      setAutoLockEnabled(enabled: boolean): void {
            this._autoLockTarget = enabled;
      }

      setAutoGrind(enabled: boolean): void {
            this._autoGrind = enabled;

            if (!enabled) {
                  this.clearTarget();
                  this._playerWaitCD = 0;
                  this._petWaitCD = 0;
            }

            this._autoConfigDirty = true;
            this._syncAutoSkillConfig(true);
            console.log('[Combat] Auto-grind:', enabled ? 'ON' : 'OFF');
      }

      toggleAutoGrind(): void {
            this.setAutoGrind(!this._autoGrind);
      }

      /** Minimal runtime AFK config (low-cost version) */
      setAutoConfig(config: { detectRange?: number; skipBossTargets?: boolean }): void {
            if (typeof config.detectRange === 'number' && Number.isFinite(config.detectRange)) {
                  this._autoDetectRange = Math.max(6, Math.min(60, Math.round(config.detectRange)));
            }
            if (typeof config.skipBossTargets === 'boolean') {
                  this._skipBossTargets = config.skipBossTargets;
            }
      }

      getAutoConfig(): { detectRange: number; skipBossTargets: boolean } {
            return {
                  detectRange: this._autoDetectRange,
                  skipBossTargets: this._skipBossTargets,
            };
      }

      // -- Main Loop --

      update(dt: number): void {
            const playerPos = this._getPlayerPos();

            this._autoConfigSyncCountdown = Math.max(0, this._autoConfigSyncCountdown - dt);
            if (this._autoConfigDirty || this._autoConfigSyncCountdown <= 0) {
                  this._syncAutoSkillConfig(this._autoConfigDirty);
                  this._autoConfigSyncCountdown = this.AUTO_CONFIG_SYNC_INTERVAL;
            }
            this._tickCooldowns(dt);
            this._regenMp(dt);

            // Tick retarget delay
            if (this._retargetDelay > 0) {
                  this._retargetDelay = Math.max(0, this._retargetDelay - dt);
                  return;
            }

            // Clear dead target
            if (this._target && this._target.isDead) {
                  this._handleMonsterDeath(this._target);
                  this._target = null;
                  this._combatSystem.clearTarget();
                  this._setPlayerTarget(null);
                  if (!this._autoGrind && this._autoLockTarget) {
                        const replacement = this._findNearestTarget(playerPos, this.MELEE_RANGE + 1.5, false);
                        if (replacement) {
                              this.selectTarget(replacement);
                              return;
                        }
                  }
                  this._retargetDelay = 0.4;
                  return;
            }

            // Boss safety: if enabled, never keep/lock boss as AFK target
            if (this._target && this._skipBossTargets && this._target.def.isBoss) {
                  this.clearTarget();
            }

            // Auto-grind: find nearest if no target
            if (this._autoGrind && !this._target) {
                  let nearest: Monster | null = null;
                  let minDist = Infinity;
                  for (const candidate of this._monsterManager.all) {
                        if (candidate.isDead) continue;
                        if (this._skipBossTargets && candidate.def.isBoss) continue;
                        const dist = candidate.distanceTo(playerPos);
                        if (dist < minDist) {
                              minDist = dist;
                              nearest = candidate;
                        }
                  }

                  if (nearest && minDist < this._autoDetectRange) {
                        this.selectTarget(nearest);
                  }
            }

            if (!this._target) return;

            const targetPos = this._target.root.position;
            const dist = Vector3.Distance(playerPos, targetPos);

            // Only attack if within melee range
            if (dist > this.MELEE_RANGE) {
                  this._setPlayerTarget(targetPos);
                  return;
            }

            // Stop player movement when in range
            this._setPlayerTarget(null);

            this._tryPlayerSkill();
            this._tryPetSkills();
      }

      private _findNearestTarget(playerPos: Vector3, maxDistance: number, skipBoss: boolean): Monster | null {
            let nearest: Monster | null = null;
            let minDist = Infinity;
            for (const candidate of this._monsterManager.all) {
                  if (candidate.isDead) continue;
                  if (skipBoss && candidate.def.isBoss) continue;
                  const dist = candidate.distanceTo(playerPos);
                  if (dist > maxDistance) continue;
                  if (dist < minDist) {
                        minDist = dist;
                        nearest = candidate;
                  }
            }
            return nearest;
      }

      // -- Auto Skill Config --

      private _syncAutoSkillConfig(force = false): void {
            const playerEquipped = this._skillBar?.getEquipped() ?? [];
            const activePets = this._petManager.active;

            const playerSig = playerEquipped.map(skill => skill?.id ?? '_').join('|');
            const petSig = activePets
                  .slice(0, 3)
                  .map(pet => {
                        if (!pet) return '_';
                        const skill = pet.def.skills[0];
                        return `${pet.def.id}:${pet.isDead ? 1 : 0}:${skill?.id ?? '_'}`;
                  })
                  .join('|');
            const signature = `${this._autoGrind ? 1 : 0}#${playerSig}#${petSig}`;
            if (!force && !this._autoConfigDirty && signature === this._autoConfigSignature) {
                  return;
            }
            this._autoConfigSignature = signature;
            this._autoConfigDirty = false;

            const nextPlayerQueue: PlayerQueueEntry[] = [];
            const playerAutoQueue: { skillId: string; enabled: boolean }[] = [];

            for (let i = 0; i < playerEquipped.length; i++) {
                  const skill = playerEquipped[i];
                  if (!skill) continue;
                  nextPlayerQueue.push({ slotIdx: i, skill });
                  playerAutoQueue.push({ skillId: skill.id, enabled: true });
            }

            if (nextPlayerQueue.length === 0) {
                  const fallback = SKILL_DEFS.find(s => s.id === 'slash') ?? SKILL_DEFS[0];
                  if (fallback) {
                        nextPlayerQueue.push({ slotIdx: -1, skill: fallback });
                        playerAutoQueue.push({ skillId: fallback.id, enabled: true });
                  }
            }

            this._playerQueue = nextPlayerQueue;
            if (this._playerNextIdx >= this._playerQueue.length) this._playerNextIdx = 0;

            this._combatSystem.setAutoQueue('player', playerAutoQueue);
            this._combatSystem.setAutoEnabled('player', this._autoGrind);

            for (let i = 0; i < 5; i++) {
                  const hasSkill = !!playerEquipped[i];
                  this._skillBar?.setAutoCast(i, this._autoGrind && hasSkill);
            }

            const nextPetQueue: PetQueueEntry[] = [];

            for (let i = 0; i < 3; i++) {
                  const pet = activePets[i];
                  if (!pet || pet.isDead || pet.def.skills.length === 0) {
                        this._combatSystem.setAutoQueue(`pet_${i}`, []);
                        this._combatSystem.setAutoEnabled(`pet_${i}`, false);
                        continue;
                  }

                  const skill = pet.def.skills[0];
                  nextPetQueue.push({ slotIdx: i, pet, skill });
                  this._combatSystem.setAutoQueue(`pet_${i}`, [{ skillId: skill.id, enabled: true }]);
                  this._combatSystem.setAutoEnabled(`pet_${i}`, this._autoGrind);
            }

            this._petQueue = nextPetQueue;
            if (this._petNextIdx >= this._petQueue.length) this._petNextIdx = 0;
      }

      // -- Cooldown / MP --

      private _tickCooldowns(dt: number): void {
            this._combatSystem.tickAllCooldowns(dt);
            this._playerWaitCD = Math.max(0, this._playerWaitCD - dt);
            this._petWaitCD = Math.max(0, this._petWaitCD - dt);
      }

      private _regenMp(dt: number): void {
            const player = Registry.player as { stats?: { mp: number; maxMp: number } } | null;
            if (player?.stats) {
                  player.stats.mp = Math.min(player.stats.maxMp, player.stats.mp + dt * 4);
            }

            for (const pet of this._petManager.active) {
                  pet.stats.mp = Math.min(pet.stats.maxMp, pet.stats.mp + dt * 2);
            }
      }

      // -- Player Strict Queue --

      private _tryPlayerSkill(): void {
            if (!this._target) return;
            if (!this._combatSystem.isAutoEnabled('player')) return;
            if (this._playerQueue.length === 0) return;
            if (this._playerWaitCD > 0) return;

            const player = Registry.player as {
                  stats?: { hp: number; maxHp: number; mp: number };
            } | null;

            const currentMp = player?.stats?.mp ?? 0;
            const hp = player?.stats?.hp ?? 100;
            const maxHp = Math.max(1, player?.stats?.maxHp ?? 100);
            const hpPct = hp / maxHp;

            let castQueueIndex = this._playerNextIdx;

            // Heal priority if HP < 30%
            if (hpPct < 0.3) {
                  const healIdx = this._playerQueue.findIndex(e =>
                        e.skill.type === 'heal'
                        && this._combatSystem.canCastSkill('player', e.skill.id, currentMp, e.skill.mpCost),
                  );
                  if (healIdx >= 0) {
                        castQueueIndex = healIdx;
                  }
            }

            const entry = this._playerQueue[castQueueIndex];
            if (!entry) return;

            const skill = entry.skill;
            if (!this._combatSystem.canCastSkill('player', skill.id, currentMp, skill.mpCost)) {
                  return;
            }

            this._combatSystem.startCooldown('player', skill.id, skill.cooldown);
            this._playerWaitCD = skill.cooldown;
            this._playerNextIdx = (castQueueIndex + 1) % this._playerQueue.length;
            this._combatSystem.setQueueCursor('player', this._playerNextIdx);

            if (player?.stats) {
                  player.stats.mp = Math.max(0, player.stats.mp - skill.mpCost);
            }

            this._skillBar?.triggerPlayerCD(entry.slotIdx, skill.cooldown);

            if (skill.type === 'heal') {
                  const healAmount = Math.round(18 + maxHp * 0.12 * skill.multiplier);
                  if (player?.stats) {
                        player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + healAmount);
                  }
                  this._showFloatingAtWorld(this._getPlayerPos().add(new Vector3(0, 1.8, 0)), `+${healAmount}`, 'counter');
                  console.log(`[Skill] Player cast heal: ${skill.name}`);
                  return;
            }

            const result = this._combatSystem.calculateDamage(
                  this._playerAtk(),
                  this._target.def.def,
                  skill.multiplier,
                  PetSeries.Plant,
                  this._target.def.series,
            );

            const died = this._target.takeDamage(result.damage);
            this._showDamageAtMonster(this._target, result.damage, result.type);
            if (died) this._handleMonsterDeath(this._target);

            const castSlot = entry.slotIdx >= 0 ? `F${entry.slotIdx + 1}` : 'AUTO';
            console.log(`[Skill] Player cast: ${skill.name} (${castSlot})`);
      }

      // -- Pet Strict Team Rotation --

      private _tryPetSkills(): void {
            if (!this._target) return;
            if (this._petQueue.length === 0) return;
            if (this._petWaitCD > 0) return;

            const entry = this._petQueue[this._petNextIdx];
            if (!entry || entry.pet.isDead) return;

            const entityId = `pet_${entry.slotIdx}`;
            if (!this._combatSystem.isAutoEnabled(entityId)) return;

            const mpCost = entry.skill.mpCost ?? 0;
            const currentMp = entry.pet.stats.mp;
            if (!this._combatSystem.canCastSkill(entityId, entry.skill.id, currentMp, mpCost)) {
                  return;
            }

            this._combatSystem.startCooldown(entityId, entry.skill.id, entry.skill.cooldown);
            this._petWaitCD = entry.skill.cooldown;
            this._petNextIdx = (this._petNextIdx + 1) % this._petQueue.length;

            entry.pet.stats.mp = Math.max(0, entry.pet.stats.mp - mpCost);
            this._skillBar?.triggerPetCD(entry.slotIdx, entry.skill.cooldown);

            const atk = entry.pet.stats.atkMin + Math.random() * (entry.pet.stats.atkMax - entry.pet.stats.atkMin);
            const skillMult = Math.max(0.6, entry.skill.damage / 10);
            const result = this._combatSystem.calculateDamage(
                  atk,
                  this._target.def.def,
                  skillMult,
                  entry.pet.def.series,
                  this._target.def.series,
            );

            if (entry.pet.def.attackType === 'ranged') {
                  const target = this._target;
                  this._projectileSystem.spawn(
                        entry.pet.root.position,
                        target.root.position,
                        entry.pet.def.series,
                        result.damage,
                        () => {
                              if (target.isDead) return;
                              const died = target.takeDamage(result.damage);
                              this._showDamageAtMonster(target, result.damage, result.type);
                              if (died) this._handleMonsterDeath(target);
                        },
                  );
            } else {
                  const died = this._target.takeDamage(result.damage);
                  this._showDamageAtMonster(this._target, result.damage, result.type);
                  if (died) this._handleMonsterDeath(this._target);
            }

            console.log(`[Skill] Pet ${entry.pet.def.name} cast: ${entry.skill.name} (P${entry.slotIdx + 1})`);
      }

      // -- Damage Display --

      private _showDamageAtMonster(
            monster: Monster,
            damage: number,
            type: import('./FloatingDamage').DamageType,
      ): void {
            this._showFloatingAtWorld(monster.root.position.add(new Vector3(0, 1.2, 0)), damage, type);
      }

      private _showFloatingAtWorld(
            worldPos: Vector3,
            value: number | string,
            type: import('./FloatingDamage').DamageType,
      ): void {
            const engine = this._scene.getEngine();
            const cam = this._scene.activeCamera;
            if (!cam) return;

            const viewport = cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            const screenPos = Vector3.Project(
                  worldPos,
                  Matrix.IdentityReadOnly,
                  this._scene.getTransformMatrix(),
                  viewport,
            );

            const xPct = (screenPos.x / engine.getRenderWidth()) * 100 + (Math.random() - 0.5) * 4;
            const yPct = (screenPos.y / engine.getRenderHeight()) * 100;
            this._floatingDamage.show(xPct, yPct, value, type);
      }

      // -- Death --

      private _handleMonsterDeath(monster: Monster): void {
            if (!monster.isDead) return;

            console.log('[Combat] Killed:', monster.def.name);

            // Track kill stats + award EXP
            if (this._inventory) {
                  this._inventory.totalKills++;
                  const expGain = monster.def.level * 10;
                  this._inventory.totalExpGained += expGain;

                  // Award EXP to player for level-up
                  const player = Registry.player;
                  if (player?.addExp) {
                        player.addExp(expGain);
                  }
            }

            // P5: Egg drop
            const eggId = this._eggDropSystem.rollDrop(monster.def.eggDropRate, monster.def.eggPetId);
            if (eggId) {
                  this._eggDropSystem.announce(this._playerName, eggId);
                  const gender = Math.random() > 0.5 ? 'male' : 'female';
                  this._petManager.addPet(eggId, gender as 'male' | 'female');
                  console.log('[Combat] Egg dropped!', eggId);
            }

            // Boss kill announcement
            if (monster.def.isBoss) {
                  this._eggDropSystem.announceBossKill(
                        this._playerName,
                        monster.def.name + ' Lv.' + monster.def.level,
                        this._monsterManager.currentZoneId,
                  );
            }

            // P7: Drop items
            if (this._dropTable && this._dropItemManager) {
                  const zoneId = this._monsterManager.currentZoneId;
                  const bossKey = monster.def.sourceMonsterType
                        ? `type_${monster.def.sourceMonsterType}`
                        : monster.def.id;
                  const drops = this._dropTable.rollDrops(
                        monster.def.level,
                        monster.def.isBoss,
                        zoneId,
                        bossKey,
                        monster.def.mobItemIdx,
                  );
                  if (drops.length > 0) {
                        this._dropItemManager.spawnDrops(drops, monster.root.position);
                        console.log(`[Combat] Dropped ${drops.length} items`);
                  }
            }

            // P9: Track quest kill
            this._questManager?.trackKill(monster.def.name, monster.def.isBoss);

            if (this._target === monster) {
                  this._target = null;
                  this._combatSystem.clearTarget();
                  this._setPlayerTarget(null);
            }
      }

      dispose(): void {
            this._scene.onPointerDown = undefined;
      }
}
