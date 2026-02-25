import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { TouchJoystick } from "./TouchJoystick";

/**
 * Portrait Camera Controller — Mobile-First
 * - Moves the player entity via touch joystick
 * - Camera follows the player smoothly
 * - Portrait-optimised angle
 */
export class PortraitCamera {
      private camera: ArcRotateCamera;
      private moveSpeed = 12; // world units per second
      private smoothing = 0.12;
      private followTarget = new Vector3(0, 2, 0);
      private playerTarget: TransformNode | null = null;
      private currentJoystickDir = Vector2.Zero();
      private isMoving = false;

      /** Optional callback for external systems to know when player is moving */
      public onMovingChanged: ((moving: boolean) => void) | null = null;

      constructor(
            private scene: Scene,
            camera: ArcRotateCamera,
            private joystick: TouchJoystick
      ) {
            this.camera = camera;

            // Lock camera to portrait-friendly angle
            this.camera.alpha = -Math.PI / 2;
            this.camera.beta = Math.PI / 2.2;
            this.camera.radius = 12;

            // Portrait limits
            this.camera.lowerRadiusLimit = 8;
            this.camera.upperRadiusLimit = 25;
            this.camera.lowerBetaLimit = Math.PI / 4;
            this.camera.upperBetaLimit = Math.PI / 1.9;
            this.camera.lowerAlphaLimit = null;
            this.camera.upperAlphaLimit = null;

            // Detach default controls — joystick handles everything
            this.camera.detachControl();

            // Subscribe to joystick direction
            this.joystick.onMove.add((dir: Vector2) => {
                  this.currentJoystickDir.copyFrom(dir);
            });

            // Register update loop
            this.scene.onBeforeRenderObservable.add(() => {
                  this.update();
            });

            console.log("[PortraitCamera] Mobile portrait camera initialized ✓");
      }

      /** Attach a player transform node so the joystick moves the player */
      public setPlayerTarget(node: TransformNode): void {
            this.playerTarget = node;
            this.followTarget.copyFrom(node.position);
            this.followTarget.y = node.position.y + 1.8;
            console.log("[PortraitCamera] Player target connected ✓");
      }

      private update(): void {
            const dt = this.scene.getEngine().getDeltaTime() / 1000;

            const dirLen = this.currentJoystickDir.length();
            const wasMoving = this.isMoving;
            this.isMoving = dirLen > 0.05;

            if (wasMoving !== this.isMoving && this.onMovingChanged) {
                  this.onMovingChanged(this.isMoving);
            }

            if (this.playerTarget && this.isMoving) {
                  // Convert 2D joystick → 3D world movement relative to camera angle
                  const forward = new Vector3(
                        Math.sin(this.camera.alpha),
                        0,
                        Math.cos(this.camera.alpha)
                  );
                  const right = new Vector3(
                        Math.sin(this.camera.alpha + Math.PI / 2),
                        0,
                        Math.cos(this.camera.alpha + Math.PI / 2)
                  );

                  const movement = forward.scale(-this.currentJoystickDir.y * this.moveSpeed * dt)
                        .add(right.scale(this.currentJoystickDir.x * this.moveSpeed * dt));

                  this.playerTarget.position.addInPlace(movement);

                  // Rotate player to face movement direction (smooth)
                  if (movement.length() > 0.001) {
                        const targetAngle = Math.atan2(movement.x, movement.z);
                        let currentY = this.playerTarget.rotation.y;
                        let diff = targetAngle - currentY;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        this.playerTarget.rotation.y += diff * 0.18;
                  }
            }

            // Smooth camera follow
            if (this.playerTarget) {
                  const px = this.playerTarget.position.x;
                  const pz = this.playerTarget.position.z;

                  this.followTarget.x += (px - this.followTarget.x) * this.smoothing;
                  this.followTarget.z += (pz - this.followTarget.z) * this.smoothing;
                  this.followTarget.y = this.playerTarget.position.y + 1.8;
            }

            this.camera.target.copyFrom(this.followTarget);
      }

      public getIsMoving(): boolean {
            return this.isMoving;
      }

      public getWorldPosition(): Vector3 {
            if (this.playerTarget) {
                  return this.playerTarget.position.clone();
            }
            return this.followTarget.clone();
      }

      public setMoveSpeed(speed: number): void {
            this.moveSpeed = speed;
      }

      public dispose(): void {
            // Clean up
      }
}
