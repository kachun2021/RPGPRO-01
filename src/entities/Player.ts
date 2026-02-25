import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3, Color3 } from "@babylonjs/core/Maths/math";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AssetManager } from "../core/AssetManager";

// ── Data Interfaces ─────────────────────────────────────────────
export interface PlayerStats {
      hp: number;
      maxHp: number;
      mp: number;
      maxMp: number;
      stamina: number;
      maxStamina: number;
      atk: number;
      def: number;
      level: number;
      exp: number;
      maxExp: number;
      gold: number;
      gems: number;
}

export interface EquipmentSlots {
      helmet: string;   // texture ID e.g. "iron", "crimson", "shadow"
      armor: string;
      weapon: string;
      accessory: string;
}

const DEFAULT_STATS: PlayerStats = {
      hp: 850, maxHp: 1000,
      mp: 600, maxMp: 1000,
      stamina: 1000, maxStamina: 1000,
      atk: 145, def: 88,
      level: 1, exp: 350, maxExp: 1000,
      gold: 12500, gems: 340,
};

const AVAILABLE_HELMETS = ["default", "iron", "crimson", "shadow", "dragon"];

/**
 * Dark Knight Player Character — Full RPG Entity
 * - Procedural geometry (with GLB override attempt)
 * - Stats system with leveling
 * - Equipment/costume swap (helmet textures)
 * - Walk + idle animation
 * - onStatsChanged observable for HUD binding
 */
export class Player {
      public root: TransformNode;
      public readonly onStatsChanged = new Observable<PlayerStats>();
      public readonly onEquipmentChanged = new Observable<EquipmentSlots>();

      private scene: Scene;
      private idleTime = 0;
      private walkTime = 0;
      private moving = false;

      // Procedural meshes
      private bodyMesh!: Mesh;
      private headMesh!: Mesh;
      private weaponMesh!: Mesh;
      private capeMesh!: Mesh;
      private leftLeg!: Mesh;
      private rightLeg!: Mesh;
      private visor!: Mesh;

      // Materials for equipment swap
      private helmetMat!: PBRMaterial;
      private bodyMat!: PBRMaterial;

      // GLB model (if loaded)
      private glbMeshes: AbstractMesh[] | null = null;

      // Game data
      private stats: PlayerStats = { ...DEFAULT_STATS };
      private equipment: EquipmentSlots = {
            helmet: "default",
            armor: "dark_plate",
            weapon: "greatsword",
            accessory: "crimson_ring",
      };

      constructor(scene: Scene) {
            this.scene = scene;
            this.root = new TransformNode("player_root", scene);
            this.root.position = new Vector3(0, 0, 0);
            this.buildCharacter();
            this.tryLoadGLB();
      }

      // ═══════════════════════════════════════════════════════════════
      // ── CHARACTER BUILDING ────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private buildCharacter(): void {
            // --- BODY (armored torso) ---
            this.bodyMesh = MeshBuilder.CreateCapsule("player_body", {
                  height: 2.0,
                  radius: 0.4,
                  tessellation: 16,
                  subdivisions: 6
            }, this.scene);
            this.bodyMesh.position.y = 1.6;
            this.bodyMesh.parent = this.root;

            this.bodyMat = new PBRMaterial("player_bodyMat", this.scene);
            this.bodyMat.albedoColor = new Color3(0.08, 0.08, 0.1);
            this.bodyMat.metallic = 0.85;
            this.bodyMat.roughness = 0.35;
            this.bodyMat.emissiveColor = new Color3(0.015, 0.005, 0.02);
            this.bodyMesh.material = this.bodyMat;

            // --- LEGS ---
            this.leftLeg = MeshBuilder.CreateCapsule("player_leftLeg", {
                  height: 1.2, radius: 0.18, tessellation: 12, subdivisions: 4
            }, this.scene);
            this.leftLeg.position.set(-0.18, 0.6, 0);
            this.leftLeg.parent = this.root;
            this.leftLeg.material = this.bodyMat;

            this.rightLeg = MeshBuilder.CreateCapsule("player_rightLeg", {
                  height: 1.2, radius: 0.18, tessellation: 12, subdivisions: 4
            }, this.scene);
            this.rightLeg.position.set(0.18, 0.6, 0);
            this.rightLeg.parent = this.root;
            this.rightLeg.material = this.bodyMat;

            // --- HEAD / HELMET ---
            this.headMesh = MeshBuilder.CreateSphere("player_head", {
                  diameter: 0.55, segments: 12
            }, this.scene);
            this.headMesh.position.y = 2.85;
            this.headMesh.parent = this.root;

            this.helmetMat = new PBRMaterial("player_helmetMat", this.scene);
            this.helmetMat.albedoColor = new Color3(0.06, 0.06, 0.08);
            this.helmetMat.metallic = 0.95;
            this.helmetMat.roughness = 0.2;
            this.helmetMat.emissiveColor = new Color3(0.01, 0.005, 0.015);
            this.headMesh.material = this.helmetMat;

            // Helmet visor (glowing red slit)
            this.visor = MeshBuilder.CreateBox("player_visor", {
                  width: 0.35, height: 0.06, depth: 0.1
            }, this.scene);
            this.visor.position.set(0, 2.88, 0.25);
            this.visor.parent = this.root;
            const visorMat = new StandardMaterial("player_visorMat", this.scene);
            visorMat.disableLighting = true;
            visorMat.emissiveColor = new Color3(1.0, 0.15, 0.08);
            this.visor.material = visorMat;

            // --- SHOULDER PADS ---
            for (const side of [-1, 1]) {
                  const shoulder = MeshBuilder.CreateSphere(`player_shoulder_${side > 0 ? 'R' : 'L'}`, {
                        diameter: 0.45, segments: 8
                  }, this.scene);
                  shoulder.position.set(side * 0.55, 2.4, 0);
                  shoulder.scaling.set(1, 0.8, 1.2);
                  shoulder.parent = this.root;

                  const shMat = new PBRMaterial(`player_shMat_${side}`, this.scene);
                  shMat.albedoColor = new Color3(0.05, 0.05, 0.07);
                  shMat.metallic = 0.9;
                  shMat.roughness = 0.25;
                  shoulder.material = shMat;

                  // Shoulder spike
                  const spike = MeshBuilder.CreateCylinder(`player_spike_${side > 0 ? 'R' : 'L'}`, {
                        height: 0.35, diameterTop: 0, diameterBottom: 0.12, tessellation: 6
                  }, this.scene);
                  spike.position.set(side * 0.65, 2.65, 0);
                  spike.rotation.z = side * -0.4;
                  spike.parent = this.root;
                  spike.material = shMat;
            }

            // --- CAPE (simple plane billowing behind) ---
            this.capeMesh = MeshBuilder.CreatePlane("player_cape", {
                  width: 0.9, height: 1.8
            }, this.scene);
            this.capeMesh.position.set(0, 1.6, -0.35);
            this.capeMesh.parent = this.root;

            const capeMat = new StandardMaterial("player_capeMat", this.scene);
            capeMat.diffuseColor = new Color3(0.4, 0.03, 0.05);
            capeMat.emissiveColor = new Color3(0.08, 0.01, 0.015);
            capeMat.backFaceCulling = false;
            capeMat.alpha = 0.85;
            this.capeMesh.material = capeMat;

            // --- WEAPON (greatsword) ---
            // Blade
            this.weaponMesh = MeshBuilder.CreateBox("player_blade", {
                  width: 0.08, height: 1.8, depth: 0.02
            }, this.scene);
            this.weaponMesh.position.set(0.7, 1.8, 0.15);
            this.weaponMesh.rotation.z = -0.15;
            this.weaponMesh.parent = this.root;

            const bladeMat = new PBRMaterial("player_bladeMat", this.scene);
            bladeMat.albedoColor = new Color3(0.6, 0.6, 0.65);
            bladeMat.metallic = 1.0;
            bladeMat.roughness = 0.15;
            bladeMat.emissiveColor = new Color3(0.3, 0.04, 0.02);
            this.weaponMesh.material = bladeMat;

            // Sword guard
            const guard = MeshBuilder.CreateBox("player_guard", {
                  width: 0.35, height: 0.06, depth: 0.06
            }, this.scene);
            guard.position.set(0.7, 1.0, 0.15);
            guard.rotation.z = -0.15;
            guard.parent = this.root;

            const guardMat = new PBRMaterial("player_guardMat", this.scene);
            guardMat.albedoColor = new Color3(0.15, 0.1, 0.05);
            guardMat.metallic = 0.8;
            guardMat.roughness = 0.4;
            guard.material = guardMat;

            // Sword handle
            const handle = MeshBuilder.CreateCylinder("player_handle", {
                  height: 0.5, diameter: 0.05, tessellation: 8
            }, this.scene);
            handle.position.set(0.7, 0.7, 0.15);
            handle.rotation.z = -0.15;
            handle.parent = this.root;
            handle.material = guardMat;

            // Blade glow edge (emissive strip along the cutting edge)
            const edgeGlow = MeshBuilder.CreateBox("player_edgeGlow", {
                  width: 0.015, height: 1.75, depth: 0.025
            }, this.scene);
            edgeGlow.position.set(0.74, 1.8, 0.15);
            edgeGlow.rotation.z = -0.15;
            edgeGlow.parent = this.root;

            const edgeMat = new StandardMaterial("player_edgeGlowMat", this.scene);
            edgeMat.disableLighting = true;
            edgeMat.emissiveColor = new Color3(1.0, 0.2, 0.05);
            edgeMat.alpha = 0.8;
            edgeGlow.material = edgeMat;
      }

      // ═══════════════════════════════════════════════════════════════
      // ── GLB MODEL LOADING ─────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      private async tryLoadGLB(): Promise<void> {
            const meshes = await AssetManager.loadMesh(
                  this.scene,
                  "assets/models/player/",
                  "base.glb"
            );
            if (meshes && meshes.length > 0) {
                  console.log("[Player] GLB model loaded, replacing procedural mesh ✓");
                  this.glbMeshes = meshes;
                  // Hide procedural meshes
                  this.root.getChildMeshes().forEach(m => m.isVisible = false);
                  // Parent GLB to root
                  meshes.forEach(m => {
                        m.parent = this.root;
                        m.isVisible = true;
                  });
            } else {
                  console.log("[Player] GLB not available, using procedural character ✓");
            }
      }

      // ═══════════════════════════════════════════════════════════════
      // ── ANIMATION ─────────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      public setMoving(isMoving: boolean): void {
            this.moving = isMoving;
            if (!isMoving) {
                  this.walkTime = 0;
                  // Reset legs to neutral
                  this.leftLeg.rotation.x = 0;
                  this.rightLeg.rotation.x = 0;
                  this.bodyMesh.rotation.x = 0;
            }
      }

      /** Call each frame for idle/walk animation */
      public update(dt: number): void {
            if (this.moving) {
                  this.updateWalk(dt);
            } else {
                  this.updateIdle(dt);
            }
      }

      private updateIdle(dt: number): void {
            this.idleTime += dt;

            // Breathing: subtle body bob
            const breathe = Math.sin(this.idleTime * 1.8) * 0.03;
            this.bodyMesh.position.y = 1.6 + breathe;
            this.headMesh.position.y = 2.85 + breathe * 1.2;

            // Cape sway
            this.capeMesh.rotation.x = Math.sin(this.idleTime * 1.2) * 0.08;
            this.capeMesh.rotation.y = Math.sin(this.idleTime * 0.7) * 0.04;

            // Weapon slight sway
            this.weaponMesh.rotation.z = -0.15 + Math.sin(this.idleTime * 0.9) * 0.02;
      }

      private updateWalk(dt: number): void {
            this.walkTime += dt;
            const speed = 6.0; // walk cycle speed

            // Leg swing (pendulum walk)
            const legSwing = Math.sin(this.walkTime * speed) * 0.4;
            this.leftLeg.rotation.x = legSwing;
            this.rightLeg.rotation.x = -legSwing;

            // Body bob (vertical bounce while walking)
            const bob = Math.abs(Math.sin(this.walkTime * speed * 2)) * 0.06;
            this.bodyMesh.position.y = 1.6 + bob;
            this.headMesh.position.y = 2.85 + bob;

            // Slight forward lean
            this.bodyMesh.rotation.x = 0.08;

            // Cape billows more when walking
            this.capeMesh.rotation.x = 0.2 + Math.sin(this.walkTime * speed * 0.8) * 0.15;
            this.capeMesh.rotation.y = Math.sin(this.walkTime * speed * 0.5) * 0.06;

            // Weapon sway
            this.weaponMesh.rotation.z = -0.15 + Math.sin(this.walkTime * speed) * 0.04;
      }

      /** Legacy method — now calls update internally */
      public updateIdle_legacy(dt: number): void {
            this.update(dt);
      }

      // ═══════════════════════════════════════════════════════════════
      // ── EQUIPMENT SYSTEM ──────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      /** Cycle to next available helmet */
      public cycleHelmet(): string {
            const currentIdx = AVAILABLE_HELMETS.indexOf(this.equipment.helmet);
            const nextIdx = (currentIdx + 1) % AVAILABLE_HELMETS.length;
            return this.equipHelmet(AVAILABLE_HELMETS[nextIdx]);
      }

      /** Equip a specific helmet by ID, changes head material */
      public equipHelmet(helmetId: string): string {
            this.equipment.helmet = helmetId;

            // Change helmet material color/properties per helmet type
            const helmetColors: Record<string, { albedo: Color3; emissive: Color3; metallic: number }> = {
                  default: { albedo: new Color3(0.06, 0.06, 0.08), emissive: new Color3(0.01, 0.005, 0.015), metallic: 0.95 },
                  iron: { albedo: new Color3(0.35, 0.35, 0.38), emissive: new Color3(0.02, 0.02, 0.025), metallic: 0.9 },
                  crimson: { albedo: new Color3(0.4, 0.05, 0.05), emissive: new Color3(0.15, 0.02, 0.02), metallic: 0.85 },
                  shadow: { albedo: new Color3(0.02, 0.02, 0.03), emissive: new Color3(0.05, 0.0, 0.08), metallic: 0.98 },
                  dragon: { albedo: new Color3(0.15, 0.08, 0.02), emissive: new Color3(0.2, 0.08, 0.02), metallic: 0.88 },
            };

            const config = helmetColors[helmetId] || helmetColors.default;
            this.helmetMat.albedoColor = config.albedo;
            this.helmetMat.emissiveColor = config.emissive;
            this.helmetMat.metallic = config.metallic;

            // Also try loading KTX2 texture if available
            AssetManager.loadTexture(this.scene, `assets/textures/player/helmet_${helmetId}.ktx2`).then((tex) => {
                  if (tex) {
                        this.helmetMat.albedoTexture = tex;
                        console.log(`[Player] Helmet texture loaded: helmet_${helmetId}.ktx2 ✓`);
                  }
            });

            console.log(`[Player] Equipped helmet: ${helmetId} ✓`);
            this.onEquipmentChanged.notifyObservers({ ...this.equipment });
            return helmetId;
      }

      public getEquipment(): EquipmentSlots {
            return { ...this.equipment };
      }

      public getAvailableHelmets(): string[] {
            return [...AVAILABLE_HELMETS];
      }

      // ═══════════════════════════════════════════════════════════════
      // ── STATS SYSTEM ──────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      public getStats(): PlayerStats {
            return { ...this.stats };
      }

      public setStats(partial: Partial<PlayerStats>): void {
            Object.assign(this.stats, partial);
            this.onStatsChanged.notifyObservers({ ...this.stats });
      }

      public addExp(amount: number): boolean {
            this.stats.exp += amount;
            let leveled = false;
            while (this.stats.exp >= this.stats.maxExp) {
                  this.stats.exp -= this.stats.maxExp;
                  leveled = true;
                  this.levelUp();
            }
            this.onStatsChanged.notifyObservers({ ...this.stats });
            return leveled;
      }

      private levelUp(): void {
            this.stats.level++;
            this.stats.maxHp += 120;
            this.stats.hp = this.stats.maxHp; // Full heal on levelup
            this.stats.maxMp += 80;
            this.stats.mp = this.stats.maxMp;
            this.stats.atk += 15;
            this.stats.def += 10;
            this.stats.maxExp = Math.floor(this.stats.maxExp * 1.5);
            console.log(`[Player] LEVEL UP! Now Lv.${this.stats.level} | ATK:${this.stats.atk} DEF:${this.stats.def} ✓`);
      }

      public takeDamage(amount: number): void {
            const reduced = Math.max(1, amount - this.stats.def * 0.3);
            this.stats.hp = Math.max(0, this.stats.hp - reduced);
            this.onStatsChanged.notifyObservers({ ...this.stats });
      }

      public heal(amount: number): void {
            this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
            this.onStatsChanged.notifyObservers({ ...this.stats });
      }

      public addGold(amount: number): void {
            this.stats.gold += amount;
            this.onStatsChanged.notifyObservers({ ...this.stats });
      }

      // ═══════════════════════════════════════════════════════════════
      // ── POSITION ──────────────────────────────────────────────────
      // ═══════════════════════════════════════════════════════════════

      public getPosition(): Vector3 {
            return this.root.position.clone();
      }

      public setPosition(pos: Vector3): void {
            this.root.position.copyFrom(pos);
      }
}
