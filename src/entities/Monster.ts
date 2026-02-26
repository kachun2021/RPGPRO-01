import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3, Color3 } from "@babylonjs/core/Maths/math";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AssetManager } from "../core/AssetManager";

// ── AI States ───────────────────────────────────────────────────
export enum MonsterState { PATROL, CHASE, ATTACK, RETREAT, DEAD }

export interface MonsterStats {
      hp: number; maxHp: number;
      atk: number; def: number;
      moveSpeed: number;
      detectRange: number;
      attackRange: number;
      goldDrop: number;
      expDrop: number;
}

const MONSTER_TYPES = [
      {
            name: "Shadow Imp", scale: 0.8, color: new Color3(0.15, 0.05, 0.2), eyeColor: new Color3(1, 0.2, 0.1),
            stats: { hp: 200, maxHp: 200, atk: 25, def: 10, moveSpeed: 4, detectRange: 12, attackRange: 2.5, goldDrop: 50, expDrop: 30 }
      },
      {
            name: "Crimson Fiend", scale: 1.0, color: new Color3(0.25, 0.03, 0.05), eyeColor: new Color3(1, 0.8, 0.1),
            stats: { hp: 350, maxHp: 350, atk: 40, def: 18, moveSpeed: 3.5, detectRange: 15, attackRange: 2.8, goldDrop: 100, expDrop: 60 }
      },
      {
            name: "Ashen Brute", scale: 1.3, color: new Color3(0.1, 0.08, 0.08), eyeColor: new Color3(0.8, 0.1, 0.1),
            stats: { hp: 600, maxHp: 600, atk: 60, def: 30, moveSpeed: 2.8, detectRange: 10, attackRange: 3.2, goldDrop: 200, expDrop: 120 }
      },
];

/**
 * Monster Entity — Dark Gothic RPG
 * Procedural demon mesh with AI state machine
 * Replaces Babylon GUI HP Bar with DOM element tracking 3D position
 */
export class Monster {
      public root: TransformNode;
      public stats: MonsterStats;
      public state = MonsterState.PATROL;
      public readonly onDeath = new Observable<Monster>();
      public name: string;
      public disposed = false;

      private scene: Scene;
      private bodyMesh!: Mesh;
      private leftEye!: Mesh;
      private rightEye!: Mesh;
      private scaleFactor: number;
      private animTime = 0;
      private attackCooldown = 0;

      // Patrol
      private patrolTarget = Vector3.Zero();
      private patrolTimer = 0;
      private spawnPos: Vector3;

      // HP Bar (DOM-based)
      private hpContainer!: HTMLElement;
      private hpFill!: HTMLElement;

      // Hit flash
      private hitFlashTime = 0;
      private originalColor: Color3;
      private bodyMat!: PBRMaterial;

      // Death fade
      private deathTimer = 0;

      constructor(scene: Scene, spawnPosition: Vector3, typeIndex?: number) {
            this.scene = scene;
            const idx = typeIndex ?? Math.floor(Math.random() * MONSTER_TYPES.length);
            const type = MONSTER_TYPES[idx];

            this.name = type.name;
            this.scaleFactor = type.scale;
            this.originalColor = type.color.clone();
            this.stats = { ...type.stats };
            this.spawnPos = spawnPosition.clone();

            this.root = new TransformNode(`monster_${this.name}_${Date.now()}`, scene);
            this.root.position = spawnPosition.clone();
            this.root.scaling = new Vector3(this.scaleFactor, this.scaleFactor, this.scaleFactor);

            this.buildMesh(type.color, type.eyeColor);
            this.createHPBar();
            this.pickNewPatrolTarget();
            this.tryLoadGLB(idx);
      }

      // ═══════════════════════════════════════════════════════════════
      // ── PROCEDURAL MESH ───────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private buildMesh(color: Color3, eyeColor: Color3): void {
            // Body
            this.bodyMesh = MeshBuilder.CreateCapsule("monBody", {
                  height: 2.2, radius: 0.5, tessellation: 12, subdivisions: 4
            }, this.scene);
            this.bodyMesh.position.y = 1.3;
            this.bodyMesh.parent = this.root;

            this.bodyMat = new PBRMaterial("monBodyMat", this.scene);
            this.bodyMat.albedoColor = color;
            this.bodyMat.metallic = 0.3;
            this.bodyMat.roughness = 0.7;
            this.bodyMat.emissiveColor = color.scale(0.15);
            this.bodyMesh.material = this.bodyMat;

            // Horns
            for (const side of [-1, 1]) {
                  const horn = MeshBuilder.CreateCylinder("monHorn", {
                        height: 0.6, diameterTop: 0, diameterBottom: 0.12, tessellation: 6
                  }, this.scene);
                  horn.position.set(side * 0.2, 2.6, 0);
                  horn.rotation.z = side * 0.5;
                  horn.parent = this.root;
                  horn.material = this.bodyMat;
            }

            // Eyes (glowing)
            const eyeMat = new StandardMaterial("monEyeMat", this.scene);
            eyeMat.disableLighting = true;
            eyeMat.emissiveColor = eyeColor;

            this.leftEye = MeshBuilder.CreateSphere("monEyeL", { diameter: 0.15 }, this.scene);
            this.leftEye.position.set(-0.15, 2.3, 0.35);
            this.leftEye.parent = this.root;
            this.leftEye.material = eyeMat;

            this.rightEye = MeshBuilder.CreateSphere("monEyeR", { diameter: 0.15 }, this.scene);
            this.rightEye.position.set(0.15, 2.3, 0.35);
            this.rightEye.parent = this.root;
            this.rightEye.material = eyeMat;

            // Tail
            const tail = MeshBuilder.CreateCylinder("monTail", {
                  height: 1.0, diameterTop: 0.04, diameterBottom: 0.1, tessellation: 6
            }, this.scene);
            tail.position.set(0, 0.8, -0.5);
            tail.rotation.x = 0.8;
            tail.parent = this.root;
            tail.material = this.bodyMat;

            // Arms
            for (const side of [-1, 1]) {
                  const arm = MeshBuilder.CreateCapsule("monArm", {
                        height: 1.0, radius: 0.12, tessellation: 8, subdivisions: 3
                  }, this.scene);
                  arm.position.set(side * 0.6, 1.8, 0);
                  arm.rotation.z = side * 0.3;
                  arm.parent = this.root;
                  arm.material = this.bodyMat;

                  // Claws
                  const claw = MeshBuilder.CreateCylinder("monClaw", {
                        height: 0.2, diameterTop: 0, diameterBottom: 0.06, tessellation: 4
                  }, this.scene);
                  claw.position.set(side * 0.7, 1.3, 0.1);
                  claw.parent = this.root;
                  claw.material = eyeMat; // glowing claws
            }
      }

      private async tryLoadGLB(typeIdx: number): Promise<void> {
            const names = ["imp", "fiend", "brute"];
            const meshes = await AssetManager.loadMesh(
                  this.scene, "assets/models/monster/", `${names[typeIdx] || "imp"}.glb`
            );
            if (meshes && meshes.length > 0) {
                  this.root.getChildMeshes().forEach(m => m.isVisible = false);
                  meshes.forEach(m => { m.parent = this.root; m.isVisible = true; });

            }
      }

      // ═══════════════════════════════════════════════════════════════
      // ── HP BAR (DOM-Based) ─────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private createHPBar(): void {
            const uiLayer = document.getElementById("ui-layer") || document.body;

            this.hpContainer = document.createElement("div");
            this.hpContainer.style.position = "absolute";
            this.hpContainer.style.width = "80px";
            this.hpContainer.style.pointerEvents = "none";
            this.hpContainer.style.transform = "translate(-50%, -100%)";
            this.hpContainer.style.zIndex = "5";

            const nameEl = document.createElement("div");
            nameEl.innerText = this.name;
            nameEl.style.color = "#ffcc88";
            nameEl.style.fontSize = "11px";
            nameEl.style.fontWeight = "bold";
            nameEl.style.textAlign = "center";
            nameEl.style.textShadow = "0 1px 2px #000, 1px 0 2px #000, -1px 0 2px #000, 0 -1px 2px #000";
            nameEl.style.marginBottom = "2px";

            const bgEl = document.createElement("div");
            bgEl.style.width = "100%";
            bgEl.style.height = "6px";
            bgEl.style.background = "rgba(0,0,0,0.8)";
            bgEl.style.border = "1px solid rgba(255,60,40,0.4)";
            bgEl.style.borderRadius = "3px";
            bgEl.style.overflow = "hidden";

            this.hpFill = document.createElement("div");
            this.hpFill.style.width = "100%";
            this.hpFill.style.height = "100%";
            this.hpFill.style.background = "#cc2222";
            this.hpFill.style.transition = "width 0.2s ease-out, background 0.2s";

            bgEl.appendChild(this.hpFill);
            this.hpContainer.appendChild(nameEl);
            this.hpContainer.appendChild(bgEl);

            uiLayer.appendChild(this.hpContainer);
            this.updateHPBarPosition();
      }

      private updateHPBarPosition(): void {
            if (!this.hpContainer || this.disposed) return;

            const engine = this.scene.getEngine();
            const screenPos = Vector3.Project(
                  this.root.position.add(new Vector3(0, 3.2 * this.scaleFactor, 0)),
                  this.root.getWorldMatrix(),
                  this.scene.getTransformMatrix(),
                  this.scene.activeCamera!.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
            );

            // Only show if in front of camera
            if (screenPos.z >= 0 && screenPos.z <= 1) {
                  this.hpContainer.style.display = "block";
                  this.hpContainer.style.left = `${screenPos.x}px`;
                  this.hpContainer.style.top = `${screenPos.y}px`;
            } else {
                  this.hpContainer.style.display = "none";
            }
      }

      private updateHPBar(): void {
            if (this.disposed || !this.hpFill) return;
            const pct = Math.max(0, this.stats.hp / this.stats.maxHp);
            this.hpFill.style.width = `${Math.round(pct * 100)}%`;

            if (pct > 0.5) this.hpFill.style.background = "#cc2222";
            else if (pct > 0.2) this.hpFill.style.background = "#cc8822";
            else this.hpFill.style.background = "#cc2222";
      }

      // ═══════════════════════════════════════════════════════════════
      // ── AI STATE MACHINE ──────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      public update(dt: number, playerPos: Vector3): void {
            if (this.disposed) return;
            this.animTime += dt;

            // Constantly update HP bar 2D position based on 3D root
            this.updateHPBarPosition();

            // Hit flash decay
            if (this.hitFlashTime > 0) {
                  this.hitFlashTime -= dt;
                  const flash = Math.max(0, this.hitFlashTime / 0.15);
                  this.bodyMat.emissiveColor = Color3.Lerp(
                        this.originalColor.scale(0.15),
                        new Color3(1, 0.3, 0.1), flash
                  );
            }

            switch (this.state) {
                  case MonsterState.PATROL: this.updatePatrol(dt, playerPos); break;
                  case MonsterState.CHASE: this.updateChase(dt, playerPos); break;
                  case MonsterState.ATTACK: this.updateAttack(dt, playerPos); break;
                  case MonsterState.RETREAT: this.updateRetreat(dt, playerPos); break;
                  case MonsterState.DEAD: this.updateDead(dt); break;
            }

            // Idle animation (body bob + eye pulse)
            if (this.state !== MonsterState.DEAD) {
                  this.bodyMesh.position.y = 1.3 + Math.sin(this.animTime * 2.5) * 0.08;
                  const eyePulse = 0.8 + Math.sin(this.animTime * 4) * 0.2;
                  this.leftEye.scaling.setAll(eyePulse);
                  this.rightEye.scaling.setAll(eyePulse);
            }
      }

      private distToPlayer(playerPos: Vector3): number {
            return Vector3.Distance(this.root.position, playerPos);
      }

      private moveToward(target: Vector3, speed: number, dt: number): void {
            const dir = target.subtract(this.root.position);
            dir.y = 0;
            if (dir.length() < 0.1) return;
            dir.normalize();
            this.root.position.addInPlace(dir.scale(speed * dt));
            // Face movement direction
            const angle = Math.atan2(dir.x, dir.z);
            let diff = angle - this.root.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.root.rotation.y += diff * 0.15;
      }

      private pickNewPatrolTarget(): void {
            const angle = Math.random() * Math.PI * 2;
            const dist = 3 + Math.random() * 5;
            this.patrolTarget = this.spawnPos.add(new Vector3(
                  Math.cos(angle) * dist, 0, Math.sin(angle) * dist
            ));
            this.patrolTimer = 2 + Math.random() * 2;
      }

      // ── PATROL ──
      private updatePatrol(dt: number, playerPos: Vector3): void {
            this.patrolTimer -= dt;
            if (this.patrolTimer <= 0) this.pickNewPatrolTarget();

            this.moveToward(this.patrolTarget, this.stats.moveSpeed * 0.5, dt);

            // Detect player
            if (this.distToPlayer(playerPos) < this.stats.detectRange) {
                  this.state = MonsterState.CHASE;
            }
      }

      // ── CHASE ──
      private updateChase(dt: number, playerPos: Vector3): void {
            const dist = this.distToPlayer(playerPos);

            if (dist > this.stats.detectRange * 1.5) {
                  this.state = MonsterState.PATROL;
                  this.pickNewPatrolTarget();
                  return;
            }

            if (dist <= this.stats.attackRange) {
                  this.state = MonsterState.ATTACK;
                  this.attackCooldown = 0;
                  return;
            }

            this.moveToward(playerPos, this.stats.moveSpeed, dt);
      }

      // ── ATTACK ──
      private updateAttack(dt: number, playerPos: Vector3): void {
            const dist = this.distToPlayer(playerPos);

            if (dist > this.stats.attackRange * 1.5) {
                  this.state = MonsterState.CHASE;
                  return;
            }

            // Retreat if low HP
            if (this.stats.hp < this.stats.maxHp * 0.2) {
                  this.state = MonsterState.RETREAT;
                  return;
            }

            // Face player
            const dir = playerPos.subtract(this.root.position);
            dir.y = 0;
            if (dir.length() > 0.1) {
                  const angle = Math.atan2(dir.x, dir.z);
                  this.root.rotation.y = angle;
            }

            // Attack with cooldown
            this.attackCooldown -= dt;
            if (this.attackCooldown <= 0) {
                  this.attackCooldown = 1.5;
                  // Attack lunge animation
                  return; // CombatSystem handles actual damage
            }

            // Attack animation: lunge forward slightly
            const lunge = Math.max(0, 1 - this.attackCooldown / 1.5);
            if (lunge < 0.3) {
                  this.bodyMesh.position.z = Math.sin(lunge * Math.PI / 0.3) * 0.3;
            } else {
                  this.bodyMesh.position.z = 0;
            }
      }

      // ── RETREAT ──
      private updateRetreat(dt: number, playerPos: Vector3): void {
            const awayDir = this.root.position.subtract(playerPos);
            awayDir.y = 0;
            awayDir.normalize();
            const retreatTarget = this.root.position.add(awayDir.scale(5));
            this.moveToward(retreatTarget, this.stats.moveSpeed * 1.2, dt);

            // If far enough, go back to patrol
            if (this.distToPlayer(playerPos) > this.stats.detectRange * 1.3) {
                  this.state = MonsterState.PATROL;
                  this.spawnPos = this.root.position.clone();
                  this.pickNewPatrolTarget();
            }
      }

      // ── DEAD ──
      private updateDead(dt: number): void {
            this.deathTimer += dt;
            // Sink into ground + fade
            this.root.position.y -= dt * 0.5;
            const alpha = Math.max(0, 1 - this.deathTimer / 1.5);
            this.root.getChildMeshes().forEach(m => {
                  if (m.material && "alpha" in m.material) {
                        (m.material as any).alpha = alpha;
                  }
            });

            if (this.deathTimer >= 1.5) {
                  this.dispose();
            }
      }

      // ═══════════════════════════════════════════════════════════════
      // ── COMBAT ────────────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      public takeDamage(amount: number): boolean {
            if (this.state === MonsterState.DEAD) return false;

            const reduced = Math.max(1, amount - this.stats.def * 0.3);
            this.stats.hp -= reduced;
            this.hitFlashTime = 0.15;
            this.updateHPBar();

            if (this.stats.hp <= 0) {
                  this.stats.hp = 0;
                  this.state = MonsterState.DEAD;
                  this.deathTimer = 0;
                  this.onDeath.notifyObservers(this);

                  // Hide HP bar on death
                  if (this.hpContainer) this.hpContainer.style.display = "none";

                  return true; // died
            }
            return false;
      }

      public isAttacking(): boolean {
            return this.state === MonsterState.ATTACK && this.attackCooldown >= 1.2;
      }

      public getPosition(): Vector3 {
            return this.root.position.clone();
      }

      public isDead(): boolean {
            return this.state === MonsterState.DEAD || this.disposed;
      }

      public dispose(): void {
            if (this.disposed) return;
            this.disposed = true;

            if (this.hpContainer && this.hpContainer.parentNode) {
                  this.hpContainer.parentNode.removeChild(this.hpContainer);
            }

            this.root.getChildMeshes().forEach(m => m.dispose());
            this.root.dispose();
            this.onDeath.clear();
      }
}
