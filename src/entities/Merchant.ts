import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3, Color3 } from "@babylonjs/core/Maths/math";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { AssetManager } from "../core/AssetManager";

/**
 * Merchant NPC — Shop interaction trigger
 * Procedural mesh (robed figure) with "Shop" label
 * Proximity-based interaction prompt
 */
export class Merchant {
      public root: TransformNode;
      public readonly onInteract = new Observable<void>();

      private scene: Scene;
      private interactRange = 4;
      private labelPlane!: Mesh;
      private labelUI!: AdvancedDynamicTexture;
      private promptPlane!: Mesh;
      private promptUI!: AdvancedDynamicTexture;
      private promptVisible = false;
      private animTime = 0;

      constructor(scene: Scene, position: Vector3) {
            this.scene = scene;
            this.root = new TransformNode("merchant_root", scene);
            this.root.position = position.clone();

            this.buildMesh();
            this.createLabel();
            this.createInteractPrompt();
            this.tryLoadGLB();
      }

      private buildMesh(): void {
            // Body (robed capsule)
            const body = MeshBuilder.CreateCapsule("mBody", {
                  height: 2.4, radius: 0.55, tessellation: 12, subdivisions: 4
            }, this.scene);
            body.position.y = 1.4;
            body.parent = this.root;

            const bodyMat = new PBRMaterial("mBodyMat", this.scene);
            bodyMat.albedoColor = new Color3(0.15, 0.1, 0.05);
            bodyMat.metallic = 0.1;
            bodyMat.roughness = 0.9;
            bodyMat.emissiveColor = new Color3(0.08, 0.05, 0.02);
            body.material = bodyMat;

            // Hood
            const hood = MeshBuilder.CreateSphere("mHood", { diameter: 0.7, segments: 8 }, this.scene);
            hood.position.set(0, 2.7, 0);
            hood.scaling.set(1, 0.7, 1);
            hood.parent = this.root;
            hood.material = bodyMat;

            // Eyes (warm glow)
            const eyeMat = new StandardMaterial("mEyeMat", this.scene);
            eyeMat.disableLighting = true;
            eyeMat.emissiveColor = new Color3(1, 0.8, 0.3);

            for (const side of [-1, 1]) {
                  const eye = MeshBuilder.CreateSphere("mEye", { diameter: 0.1 }, this.scene);
                  eye.position.set(side * 0.12, 2.65, 0.25);
                  eye.parent = this.root;
                  eye.material = eyeMat;
            }

            // Backpack/sack
            const sack = MeshBuilder.CreateSphere("mSack", { diameter: 0.8, segments: 8 }, this.scene);
            sack.position.set(0, 1.5, -0.5);
            sack.scaling.set(0.8, 1, 0.7);
            sack.parent = this.root;

            const sackMat = new PBRMaterial("mSackMat", this.scene);
            sackMat.albedoColor = new Color3(0.3, 0.2, 0.1);
            sackMat.metallic = 0;
            sackMat.roughness = 1;
            sack.material = sackMat;

            // Staff
            const staff = MeshBuilder.CreateCylinder("mStaff", {
                  height: 2.5, diameterTop: 0.04, diameterBottom: 0.06, tessellation: 6
            }, this.scene);
            staff.position.set(0.6, 1.5, 0);
            staff.parent = this.root;

            const staffMat = new PBRMaterial("mStaffMat", this.scene);
            staffMat.albedoColor = new Color3(0.3, 0.15, 0.05);
            staffMat.metallic = 0.2;
            staffMat.roughness = 0.8;
            staff.material = staffMat;

            // Staff gem
            const gem = MeshBuilder.CreateSphere("mGem", { diameter: 0.15 }, this.scene);
            gem.position.set(0.6, 2.8, 0);
            gem.parent = this.root;

            const gemMat = new StandardMaterial("mGemMat", this.scene);
            gemMat.disableLighting = true;
            gemMat.emissiveColor = new Color3(0.2, 0.8, 0.4);
            gem.material = gemMat;
      }

      private async tryLoadGLB(): Promise<void> {
            const meshes = await AssetManager.loadMesh(this.scene, "assets/models/npc/", "merchant.glb");
            if (meshes && meshes.length > 0) {
                  this.root.getChildMeshes().forEach(m => m.isVisible = false);
                  meshes.forEach(m => { m.parent = this.root; m.isVisible = true; });

            }
      }

      private createLabel(): void {
            this.labelPlane = MeshBuilder.CreatePlane("mLabel", { width: 2.5, height: 0.5 }, this.scene);
            this.labelPlane.position.y = 3.6;
            this.labelPlane.parent = this.root;
            this.labelPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
            this.labelPlane.isPickable = false;

            this.labelUI = AdvancedDynamicTexture.CreateForMesh(this.labelPlane, 256, 48);

            const label = new TextBlock("mLabelTxt", "🛒 SHOP");
            label.color = "#faad14";
            label.fontSize = 28;
            label.fontFamily = "'Inter', sans-serif";
            label.fontWeight = "700";
            label.shadowColor = "rgba(0,0,0,0.9)";
            label.shadowBlur = 5;
            this.labelUI.addControl(label);
      }

      private createInteractPrompt(): void {
            this.promptPlane = MeshBuilder.CreatePlane("mPrompt", { width: 3, height: 0.5 }, this.scene);
            this.promptPlane.position.y = 4.2;
            this.promptPlane.parent = this.root;
            this.promptPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
            this.promptPlane.isPickable = true;
            this.promptPlane.isVisible = false;

            this.promptUI = AdvancedDynamicTexture.CreateForMesh(this.promptPlane, 320, 48);

            const bg = new Rectangle("promptBg");
            bg.width = "300px";
            bg.height = "40px";
            bg.background = "rgba(0, 0, 0, 0.7)";
            bg.color = "rgba(250, 173, 20, 0.5)";
            bg.thickness = 1;
            bg.cornerRadius = 20;
            this.promptUI.addControl(bg);

            const prompt = new TextBlock("promptTxt", "TAP TO BROWSE");
            prompt.color = "#ffffff";
            prompt.fontSize = 20;
            prompt.fontFamily = "'Inter', sans-serif";
            prompt.fontWeight = "600";
            bg.addControl(prompt);

            bg.isPointerBlocker = true;
            bg.onPointerClickObservable.add(() => {
                  this.onInteract.notifyObservers();
            });
      }

      public update(dt: number, playerPos: Vector3): void {
            this.animTime += dt;

            // Idle animation: gentle bob
            const meshes = this.root.getChildMeshes();
            if (meshes.length > 0) {
                  // gentile body rotation
                  this.root.rotation.y += Math.sin(this.animTime * 0.5) * 0.002;
            }

            // Proximity check for interaction prompt
            const dist = Vector3.Distance(this.root.position, playerPos);
            const shouldShow = dist < this.interactRange;

            if (shouldShow !== this.promptVisible) {
                  this.promptVisible = shouldShow;
                  this.promptPlane.isVisible = shouldShow;
            }

            // Pulsing prompt
            if (this.promptVisible) {
                  const pulse = 0.9 + Math.sin(this.animTime * 3) * 0.1;
                  this.promptPlane.scaling.setAll(pulse);
            }
      }

      /**
       * Check if player is close enough to interact
       */
      public canInteract(playerPos: Vector3): boolean {
            return Vector3.Distance(this.root.position, playerPos) < this.interactRange;
      }

      public getPosition(): Vector3 {
            return this.root.position.clone();
      }

      public dispose(): void {
            this.labelUI.dispose();
            this.labelPlane.dispose();
            this.promptUI.dispose();
            this.promptPlane.dispose();
            this.root.getChildMeshes().forEach(m => m.dispose());
            this.root.dispose();
            this.onInteract.clear();
      }
}
