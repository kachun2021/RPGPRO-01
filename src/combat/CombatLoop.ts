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

      private _target: Monster | null = null;
      private _autoGrind = false;

      // Player skill CDs (5 slots, F1-F5)
      private _playerSkillCDs: number[] = [0, 0, 0, 0, 0];

      // Pet skill CDs (3 slots, P1-P3)
      private _petSkillCDs: number[] = [0, 0, 0];

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
            for (let i = 0; i < 5; i++) {
                  if (this._playerSkillCDs[i] > 0) {
                        this._playerSkillCDs[i] = Math.max(0, this._playerSkillCDs[i] - dt);
                  }
            }
            for (let i = 0; i < 3; i++) {
                  if (this._petSkillCDs[i] > 0) {
                        this._petSkillCDs[i] = Math.max(0, this._petSkillCDs[i] - dt);
                  }
            }
      }

      // -- Player Skill Queue --

      private _tryPlayerSkill(): void {
            if (!this._target) return;

            const equipped = this._skillBar?.getEquipped() ?? [];

            // Scan F1→F5, cast first off-CD skill
            for (let i = 0; i < 5; i++) {
                  if (this._playerSkillCDs[i] > 0) continue;
                  const skill = equipped[i] ?? SKILL_DEFS[i];
                  if (!skill) continue;

                  // Start CD
                  this._playerSkillCDs[i] = skill.cooldown;

                  // Trigger UI CD on SkillBar
                  this._skillBar?.triggerPlayerCD(i, skill.cooldown);

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
                  return; // Only cast ONE player skill per frame
            }
      }

      // -- Pet Skill Queue --

      private _tryPetSkills(): void {
            if (!this._target) return;

            const activePets = this._petManager.active;

            // Scan P1→P3, cast first off-CD pet skill
            for (let i = 0; i < Math.min(activePets.length, 3); i++) {
                  if (this._petSkillCDs[i] > 0) continue;
                  const pet = activePets[i];
                  if (pet.isDead) continue;

                  const petDef = PET_DEFS.find(d => d.id === pet.def.id);
                  const skill = petDef?.skills?.[0];
                  if (!skill) continue;

                  // Start CD
                  this._petSkillCDs[i] = skill.cooldown;

                  // Trigger UI CD on SkillBar
                  this._skillBar?.triggerPetCD(i, skill.cooldown);

                  // Perform pet attack with skill damage as base
                  const atk = pet.stats.atkMin + Math.random() * (pet.stats.atkMax - pet.stats.atkMin);
                  const skillMult = skill.damage / 10; // skill damage as multiplier
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
                        const died = this._target.takeDamage(result.damage);
                        this._showDamageAtMonster(this._target, result.damage, result.type);
                        if (died) this._handleMonsterDeath(this._target);
                  }
                  return; // Only cast ONE pet skill per frame
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

            const eggId = this._eggDropSystem.rollDrop(monster.def.eggDropRate, monster.def.eggPetId);
            if (eggId) {
                  this._eggDropSystem.announce(this._playerName, eggId);
                  const gender = Math.random() > 0.5 ? 'male' : 'female';
                  this._petManager.addPet(eggId, gender as any);
                  console.log('[Combat] Egg dropped!', eggId);
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
