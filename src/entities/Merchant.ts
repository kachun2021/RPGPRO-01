import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3, Color3 } from "@babylonjs/core/Maths/math";
import { Observable } from "@babylonjs/core/Misc/observable";
import { AssetManager } from "../core/AssetManager";

/**
 * Merchant NPC — Shop interaction trigger
 * Procedural mesh (robed figure) with "Shop" label
 * Proximity-based DOM interaction prompt
 */
export class Merchant {
      public root: TransformNode;
      public readonly onInteract = new Observable<void>();

      private scene: Scene;
      private interactRange = 4;
      private promptVisible = false;
      private animTime = 0;

      // DOM-based UI
      private labelContainer!: HTMLElement;
      private promptContainer!: HTMLElement;

      constructor(scene: Scene, position: Vector3) {
            this.scene = scene;
            this.root = new TransformNode("merchant_root", scene);
            this.root.position = position.clone();

            this.buildMesh();
            this.createUI();
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

      private createUI(): void {
            const uiLayer = document.getElementById("ui-layer") || document.body;

            // 1. Static Label "🛒 SHOP"
            this.labelContainer = document.createElement("div");
            this.labelContainer.style.position = "absolute";
            this.labelContainer.style.pointerEvents = "none";
            this.labelContainer.style.transform = "translate(-50%, -100%)";
            this.labelContainer.style.zIndex = "4";

            const labelText = document.createElement("div");
            labelText.innerText = "🛒 SHOP";
            labelText.style.color = "#faad14";
            labelText.style.fontSize = "16px";
            labelText.style.fontFamily = "'Inter', sans-serif";
            labelText.style.fontWeight = "700";
            labelText.style.textShadow = "0 2px 4px rgba(0,0,0,0.9)";

            this.labelContainer.appendChild(labelText);
            uiLayer.appendChild(this.labelContainer);

            // 2. Interactive Prompt "TAP TO BROWSE"
            this.promptContainer = document.createElement("div");
            this.promptContainer.style.position = "absolute";
            this.promptContainer.style.transform = "translate(-50%, -100%)";
            this.promptContainer.style.zIndex = "6";
            this.promptContainer.style.display = "none";
            this.promptContainer.style.cursor = "pointer";
            this.promptContainer.style.pointerEvents = "auto";

            const promptBtn = document.createElement("button");
            promptBtn.innerText = "TAP TO BROWSE";
            promptBtn.style.background = "rgba(10, 10, 16, 0.85)";
            promptBtn.style.color = "#ffffff";
            promptBtn.style.border = "1px solid rgba(250, 173, 20, 0.5)";
            promptBtn.style.borderRadius = "20px";
            promptBtn.style.padding = "8px 16px";
            promptBtn.style.fontSize = "14px";
            promptBtn.style.fontWeight = "600";
            promptBtn.style.fontFamily = "'Inter', sans-serif";
            promptBtn.style.backdropFilter = "blur(10px)";
            (promptBtn.style as any).webkitBackdropFilter = "blur(10px)";
            promptBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
            promptBtn.style.transition = "transform 0.2s, background 0.2s";

            promptBtn.addEventListener("pointerdown", () => {
                  promptBtn.style.transform = "scale(0.9)";
                  promptBtn.style.background = "rgba(250, 173, 20, 0.2)";
            });

            promptBtn.addEventListener("pointerup", () => {
                  promptBtn.style.transform = "scale(1)";
                  promptBtn.style.background = "rgba(10, 10, 16, 0.85)";
            });

            promptBtn.addEventListener("click", () => {
                  this.onInteract.notifyObservers();
            });

            this.promptContainer.appendChild(promptBtn);
            uiLayer.appendChild(this.promptContainer);
      }

      private updateUIPositions(): void {
            if (!this.root || this.root.isDisposed()) return;

            const engine = this.scene.getEngine();
            const viewport = this.scene.activeCamera!.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            const matrix = this.scene.getTransformMatrix();

            // 1. Label Position
            const labelPos = Vector3.Project(
                  this.root.position.add(new Vector3(0, 3.6, 0)),
                  this.root.getWorldMatrix(),
                  matrix,
                  viewport
            );

            if (labelPos.z >= 0 && labelPos.z <= 1) {
                  this.labelContainer.style.display = "block";
                  this.labelContainer.style.left = `${labelPos.x}px`;
                  this.labelContainer.style.top = `${labelPos.y}px`;
            } else {
                  this.labelContainer.style.display = "none";
            }

            // 2. Prompt Position
            if (this.promptVisible) {
                  const promptPos = Vector3.Project(
                        this.root.position.add(new Vector3(0, 4.2, 0)),
                        this.root.getWorldMatrix(),
                        matrix,
                        viewport
                  );

                  if (promptPos.z >= 0 && promptPos.z <= 1) {
                        this.promptContainer.style.display = "block";
                        this.promptContainer.style.left = `${promptPos.x}px`;
                        this.promptContainer.style.top = `${promptPos.y}px`;

                        // Pulsing effect handled via transform on the container
                        const pulse = 1 + Math.sin(this.animTime * 3) * 0.05;
                        this.promptContainer.style.transform = `translate(-50%, -100%) scale(${pulse})`;
                  } else {
                        this.promptContainer.style.display = "none";
                  }
            }
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
                  if (!shouldShow && this.promptContainer) {
                        this.promptContainer.style.display = "none";
                  }
            }

            // Update DOM element overlays exactly matching Babylon 3D coords
            this.updateUIPositions();
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
            if (this.labelContainer && this.labelContainer.parentNode) {
                  this.labelContainer.parentNode.removeChild(this.labelContainer);
            }
            if (this.promptContainer && this.promptContainer.parentNode) {
                  this.promptContainer.parentNode.removeChild(this.promptContainer);
            }

            this.root.getChildMeshes().forEach(m => m.dispose());
            this.root.dispose();
            this.onInteract.clear();
      }
}
