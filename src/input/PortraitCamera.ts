import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { TouchJoystick } from "./TouchJoystick";
import { InputManager } from "./InputManager";

/**
 * Portrait Camera Controller — Mobile-First
 * - Moves the player entity via touch joystick AND keyboard (WASD)
 * - Camera follows the player smoothly
 * - Portrait-optimised angle
 */
export class PortraitCamera {
      private camera: ArcRotateCamera;
      private moveSpeed = 15; // world units per second (was 12, feels snappier)
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
            private joystick: TouchJoystick,
            private inputManager?: InputManager
      ) {
            this.camera = camera;

            // Lock camera to portrait-friendly angle
            this.camera.alpha = -Math.PI / 2;
            this.camera.beta = Math.PI / 2.4;
            this.camera.radius = 22;

            // Portrait limits
            this.camera.lowerRadiusLimit = 12;
            this.camera.upperRadiusLimit = 40;
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

            // Subscribe to keyboard direction (WASD / arrows)
            if (this.inputManager) {
                  this.inputManager.onKeyboardMove.add((dir: Vector2) => {
                        this.currentJoystickDir.copyFrom(dir);
                  });
            }

            // Register update loop
            this.scene.onBeforeRenderObservable.add(() => {
                  this.update();
            });


      }

      /** Attach a player transform node so the joystick moves the player */
      public setPlayerTarget(node: TransformNode): void {
            this.playerTarget = node;
            this.followTarget.copyFrom(node.position);
            this.followTarget.y = node.position.y + 1.8;

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
                  // ── Derive directions from camera's ACTUAL view matrix ──
                  // This is bulletproof — works regardless of alpha/beta values
                  const camForward = this.camera.getDirection(Vector3.Forward());
                  const camRight = this.camera.getDirection(Vector3.Right());

                  // Project onto XZ plane (we only move horizontally)
                  const fwdX = camForward.x;
                  const fwdZ = camForward.z;
                  const rgtX = camRight.x;
                  const rgtZ = camRight.z;

                  // Joystick: x positive=screen-right, y positive=screen-down
                  const joyX = this.currentJoystickDir.x;
                  const joyY = -this.currentJoystickDir.y;  // negate: screen-up → forward

                  const moveX = (fwdX * joyY + rgtX * joyX) * this.moveSpeed * dt;
                  const moveZ = (fwdZ * joyY + rgtZ * joyX) * this.moveSpeed * dt;

                  this.playerTarget.position.x += moveX;
                  this.playerTarget.position.z += moveZ;

                  // Rotate player to face movement direction
                  const moveMagnitude = Math.sqrt(moveX * moveX + moveZ * moveZ);
                  if (moveMagnitude > 0.001) {
                        const targetAngle = Math.atan2(moveX, moveZ);
                        let currentY = this.playerTarget.rotation.y;
                        let diff = targetAngle - currentY;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        this.playerTarget.rotation.y += diff * 0.35;
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
