import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Vector3, Color3 } from "@babylonjs/core/Maths/math";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AssetManager } from "../core/AssetManager";

export type DropType = "gold" | "exp" | "hp";

export interface DropReward {
      type: DropType;
      amount: number;
}

/**
 * DropItem — 3D collectible loot with bounce, spin, glow, and auto-pickup
 */
export class DropItem {
      public readonly onCollect = new Observable<DropReward>();
      public disposed = false;
      public reward: DropReward;

      private scene: Scene;
      private root: TransformNode;
      private mesh!: Mesh;
      private mat!: PBRMaterial;
      private time = 0;
      private phase: "bounce" | "idle" | "pickup" | "done" = "bounce";

      // Bounce physics
      private velocityY = 6;
      private gravity = -20;
      private bounceCount = 0;

      // Pickup lerp
      private pickupTarget: Vector3 | null = null;
      private pickupSpeed = 0;
      private pickupRadius = 3;

      private static glbLoaded = false;
      private static glbMesh: Mesh | null = null;

      constructor(scene: Scene, position: Vector3, reward: DropReward) {
            this.scene = scene;
            this.reward = reward;

            this.root = new TransformNode(`drop_${reward.type}_${Date.now()}`, scene);
            this.root.position = position.clone();
            this.root.position.y = 0.5; // start slightly above ground

            this.buildMesh();
      }

      private buildMesh(): void {
            const colors: Record<DropType, { albedo: Color3; emissive: Color3 }> = {
                  gold: { albedo: new Color3(1, 0.85, 0.2), emissive: new Color3(0.6, 0.4, 0) },
                  exp: { albedo: new Color3(0.2, 0.8, 1.0), emissive: new Color3(0, 0.3, 0.5) },
                  hp: { albedo: new Color3(1, 0.2, 0.3), emissive: new Color3(0.4, 0, 0) },
            };

            const c = colors[this.reward.type] || colors.gold;

            // Coin shape
            this.mesh = MeshBuilder.CreateCylinder("dropMesh", {
                  height: 0.12, diameter: 0.5, tessellation: 16
            }, this.scene);
            this.mesh.parent = this.root;
            this.mesh.rotation.x = Math.PI / 2;

            // Inner ring detail
            const inner = MeshBuilder.CreateTorus("dropRing", {
                  diameter: 0.35, thickness: 0.04, tessellation: 16
            }, this.scene);
            inner.parent = this.mesh;
            inner.position.z = 0.01;

            this.mat = new PBRMaterial("dropMat", this.scene);
            this.mat.albedoColor = c.albedo;
            this.mat.metallic = 0.9;
            this.mat.roughness = 0.15;
            this.mat.emissiveColor = c.emissive;
            this.mesh.material = this.mat;
            inner.material = this.mat;

            // Scale - smaller for better visual
            this.root.scaling.setAll(0.8);

            // Try GLB
            this.tryLoadGLB();
      }

      private async tryLoadGLB(): Promise<void> {
            if (this.reward.type !== "gold") return;
            const meshes = await AssetManager.loadMesh(
                  this.scene, "assets/models/drop/", "coin.glb"
            );
            if (meshes && meshes.length > 0) {
                  this.mesh.isVisible = false;
                  meshes.forEach(m => { m.parent = this.root; });

            }
      }

      public update(dt: number, playerPos: Vector3): void {
            if (this.disposed) return;
            this.time += dt;

            switch (this.phase) {
                  case "bounce":
                        this.updateBounce(dt);
                        break;
                  case "idle":
                        this.updateIdle(dt, playerPos);
                        break;
                  case "pickup":
                        this.updatePickup(dt);
                        break;
            }

            // Spin always
            if (this.phase !== "done") {
                  this.root.rotation.y += dt * 3;
            }
      }

      private updateBounce(dt: number): void {
            this.velocityY += this.gravity * dt;
            this.root.position.y += this.velocityY * dt;

            if (this.root.position.y <= 0.3) {
                  this.root.position.y = 0.3;
                  this.bounceCount++;
                  this.velocityY = -this.velocityY * 0.4; // dampen bounce

                  if (this.bounceCount >= 3 || Math.abs(this.velocityY) < 0.5) {
                        this.root.position.y = 0.3;
                        this.phase = "idle";
                  }
            }
      }

      private updateIdle(dt: number, playerPos: Vector3): void {
            // Float bob
            this.root.position.y = 0.3 + Math.sin(this.time * 3) * 0.1;

            // Emissive pulse
            const pulse = 0.6 + Math.sin(this.time * 4) * 0.4;
            this.mat.emissiveIntensity = pulse;

            // Check auto-pickup range
            const dist = Vector3.Distance(this.root.position, playerPos);
            if (dist < this.pickupRadius) {
                  this.phase = "pickup";
                  this.pickupTarget = playerPos;
                  this.pickupSpeed = 2;
            }
      }

      private updatePickup(dt: number): void {
            if (!this.pickupTarget) return;

            this.pickupSpeed += dt * 25; // accelerate toward player
            const dir = this.pickupTarget.subtract(this.root.position);
            const dist = dir.length();

            if (dist < 0.5) {
                  // Collected!
                  this.phase = "done";
                  this.onCollect.notifyObservers(this.reward);
                  this.dispose();
                  return;
            }

            dir.normalize();
            this.root.position.addInPlace(dir.scale(this.pickupSpeed * dt));

            // Scale down as approaching
            const shrink = Math.max(0.2, dist / this.pickupRadius);
            this.root.scaling.setAll(0.8 * shrink);

            // Increase glow
            this.mat.emissiveIntensity = 2;
      }

      public setPickupTarget(pos: Vector3): void {
            this.pickupTarget = pos;
      }

      public getPosition(): Vector3 {
            return this.root.position.clone();
      }

      public dispose(): void {
            if (this.disposed) return;
            this.disposed = true;
            this.root.getChildMeshes().forEach(m => m.dispose());
            this.root.dispose();
            this.onCollect.clear();
      }
}
