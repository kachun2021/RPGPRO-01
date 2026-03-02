import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { SKILL_DEFS, type CombatSystem } from './CombatSystem';
import type { ProjectileSystem } from './ProjectileSystem';
import type { FloatingDamage } from './FloatingDamage';
import type { MonsterManager } from '../entities/MonsterManager';
import type { Monster } from '../entities/Monster';
import type { EggDropSystem } from '../systems/EggDropSystem';
import type { PetManager } from '../pets/PetManager';
import type { Pet } from '../pets/Pet';
import { PET_DEFS, PetSeries } from '../pets/PetData';
import type { SkillBar } from '../ui/SkillBar';
import type { DropTable } from '../systems/DropTable';
import type { DropItemManager } from '../entities/DropItem';
import type { Inventory } from '../systems/Inventory';

/**
 * CombatLoop - orchestrates combat flow:
 * Click/auto-select monster -> walk to target -> player + pets attack -> damage -> death -> egg
 *
 * Auto-Skill Logic:
 * - Player: scan F1→F5, cast first off-CD skill (sequential within player)
 * - Pets: each pet casts their 1 skill on its own CD (sequential within pets, P1→P3)
 * - Player and pets cast independently (parallel between player & pets)
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

      private _target: Monster | null = null;
      private _autoGrind = false;

      // Sequential skill queue: player
      private _playerNextIdx = 0;   // which F slot to cast next (0-4)
      private _playerWaitCD = 0;    // global wait: must reach 0 before next cast

      // Sequential skill queue: pets
      private _petNextIdx = 0;      // which P slot to cast next (0-2)
      private _petWaitCD = 0;       // global wait: must reach 0 before next cast

      // Player references
      private _getPlayerPos: () => Vector3;
      private _setPlayerTarget: (pos: Vector3 | null) => void;
      private _playerAtk: () => number;
      private _playerName: string;

      /** Melee attack range */
      private readonly MELEE_RANGE = 2.5;
      /** Auto-grind detection range */
      private readonly AUTO_DETECT_RANGE = 20;

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
      }

      /** P7: Connect drop system */
      setDropSystem(dropTable: DropTable, dropItemManager: DropItemManager, inventory: Inventory): void {
            this._dropTable = dropTable;
            this._dropItemManager = dropItemManager;
            this._inventory = inventory;
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

      setAutoGrind(enabled: boolean): void {
            this._autoGrind = enabled;
            if (!enabled) {
                  this.clearTarget();
            }
            console.log('[Combat] Auto-grind:', enabled ? 'ON' : 'OFF');
      }

      toggleAutoGrind(): void {
            this.setAutoGrind(!this._autoGrind);
      }

      // -- Main Loop --

      update(dt: number): void {
            const playerPos = this._getPlayerPos();

            // Tick all CDs down
            this._tickCooldowns(dt);

            // Auto-grind: find nearest if no target
            if (this._autoGrind && (!this._target || this._target.isDead)) {
                  const nearest = this._monsterManager.findClosest(playerPos);
                  if (nearest && nearest.distanceTo(playerPos) < this.AUTO_DETECT_RANGE) {
                        this.selectTarget(nearest);
                  }
            }

            // Clear dead target
            if (this._target && this._target.isDead) {
                  this._handleMonsterDeath(this._target);
                  this._target = null;
                  this._combatSystem.clearTarget();
                  this._setPlayerTarget(null);
                  return;
            }

            if (!this._target) return;

            const targetPos = this._target.root.position;
            const dist = Vector3.Distance(playerPos, targetPos);

            // Keep player walking toward target
            this._setPlayerTarget(targetPos);

            // Only attack if within melee range
            if (dist > this.MELEE_RANGE) return;

            // Stop player movement when in range
            this._setPlayerTarget(null);

            // ── Auto-Skill: Player (F1→F5, first off-CD) ──
            this._tryPlayerSkill();

            // ── Auto-Skill: Pets (P1→P3, each on own CD) ──
            this._tryPetSkills();
      }

      // -- Cooldown System --

      private _tickCooldowns(dt: number): void {
            if (this._playerWaitCD > 0) {
                  this._playerWaitCD = Math.max(0, this._playerWaitCD - dt);
            }
            if (this._petWaitCD > 0) {
                  this._petWaitCD = Math.max(0, this._petWaitCD - dt);
            }
      }

      // -- Player Skill Queue (Sequential: F1 → wait CD → F2 → wait CD → ...) --

      private _tryPlayerSkill(): void {
            if (!this._target) return;
            if (this._playerWaitCD > 0) return; // still waiting for current skill CD

            const equipped = this._skillBar?.getEquipped() ?? [];

            // Try current slot, skip empty slots
            let attempts = 0;
            while (attempts < 5) {
                  const idx = this._playerNextIdx;
                  const skill = equipped[idx] ?? SKILL_DEFS[idx];
                  this._playerNextIdx = (this._playerNextIdx + 1) % 5;
                  attempts++;

                  if (!skill) continue;

                  // Cast this skill
                  this._playerWaitCD = skill.cooldown;

                  // Trigger UI CD on SkillBar
                  this._skillBar?.triggerPlayerCD(idx, skill.cooldown);

                  // Perform attack with skill multiplier
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

                  console.log(`[Skill] Player cast: ${skill.name} (F${idx + 1}), CD: ${skill.cooldown}s`);
                  return;
            }
      }

      // -- Pet Skill Queue (Sequential: P1 → wait CD → P2 → wait CD → ...) --

      private _tryPetSkills(): void {
            if (!this._target) return;
            if (this._petWaitCD > 0) return; // still waiting for current pet skill CD

            const activePets = this._petManager.active;
            if (activePets.length === 0) return;

            // Try current slot, skip dead pets
            let attempts = 0;
            while (attempts < 3) {
                  const idx = this._petNextIdx;
                  this._petNextIdx = (this._petNextIdx + 1) % Math.min(activePets.length, 3);
                  attempts++;

                  if (idx >= activePets.length) continue;
                  const pet = activePets[idx];
                  if (pet.isDead) continue;

                  const petDef = PET_DEFS.find(d => d.id === pet.def.id);
                  const skill = petDef?.skills?.[0];
                  if (!skill) continue;

                  // Set global pet wait CD
                  this._petWaitCD = skill.cooldown;

                  // Trigger UI CD on SkillBar
                  this._skillBar?.triggerPetCD(idx, skill.cooldown);

                  // Perform pet attack
                  const atk = pet.stats.atkMin + Math.random() * (pet.stats.atkMax - pet.stats.atkMin);
                  const skillMult = skill.damage / 10;
                  const result = this._combatSystem.calculateDamage(
                        atk, this._target.def.def, skillMult,
                        pet.def.series, this._target.def.series,
                  );

                  const targetPos = this._target.root.position;

                  if (pet.def.attackType === 'ranged') {
                        const target = this._target;
                        this._projectileSystem.spawn(
                              pet.root.position, targetPos, pet.def.series, result.damage,
                              () => {
                                    if (target.isDead) return;
                                    const died = target.takeDamage(result.damage);
                                    this._showDamageAtMonster(target, result.damage, result.type);
                                    if (died) this._handleMonsterDeath(target);
                              },
                        );
                  } else {
                        // Melee: direct damage, no projectile
                        const died = this._target.takeDamage(result.damage);
                        this._showDamageAtMonster(this._target, result.damage, result.type);
                        if (died) this._handleMonsterDeath(this._target);
                  }

                  console.log(`[Skill] Pet ${pet.def.name} cast: ${skill.name} (P${idx + 1}), CD: ${skill.cooldown}s`);
                  return;
            }
      }

      // -- Damage Display --

      private _showDamageAtMonster(monster: Monster, damage: number, type: import('./FloatingDamage').DamageType): void {
            const engine = this._scene.getEngine();
            const cam = this._scene.activeCamera;
            if (!cam) return;

            const worldPos = monster.root.position.add(new Vector3(0, 1.2, 0));
            const viewport = cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            const screenPos = Vector3.Project(
                  worldPos,
                  Matrix.IdentityReadOnly,
                  this._scene.getTransformMatrix(),
                  viewport,
            );

            const xPct = (screenPos.x / engine.getRenderWidth()) * 100 + (Math.random() - 0.5) * 4;
            const yPct = (screenPos.y / engine.getRenderHeight()) * 100;

            this._floatingDamage.show(xPct, yPct, damage, type);
      }

      // -- Death --

      private _handleMonsterDeath(monster: Monster): void {
            console.log('[Combat] Killed:', monster.def.name);

            // Track kill stats
            if (this._inventory) {
                  this._inventory.totalKills++;
                  this._inventory.totalExpGained += monster.def.level * 10;
            }

            // P5: Egg drop
            const eggId = this._eggDropSystem.rollDrop(monster.def.eggDropRate, monster.def.eggPetId);
            if (eggId) {
                  this._eggDropSystem.announce(this._playerName, eggId);
                  const gender = Math.random() > 0.5 ? 'male' : 'female';
                  this._petManager.addPet(eggId, gender as any);
                  console.log('[Combat] Egg dropped!', eggId);
            }

            // P7: Drop items
            if (this._dropTable && this._dropItemManager) {
                  const isBoss = monster.def.isBoss;
                  const drops = this._dropTable.rollDrops(monster.def.level, isBoss);
                  if (drops.length > 0) {
                        this._dropItemManager.spawnDrops(drops, monster.root.position);
                        console.log(`[Combat] Dropped ${drops.length} items`);
                  }
            }

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
