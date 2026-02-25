import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TouchJoystick } from "./TouchJoystick";

/**
 * Portrait Camera Controller
 * - Locks to 45° overhead angle (RPG isometric-like)
 * - Follows a target position (moved by joystick)
 * - Smooth interpolation
 * - Safe-area margins for notch/pill displays
 */
export class PortraitCamera {
      private camera: ArcRotateCamera;
      private targetPosition = Vector3.Zero();
      private moveSpeed = 0.3;
      private smoothing = 0.08; // lower = smoother follow
      private followTarget = new Vector3(0, 3, 0);

      constructor(
            private scene: Scene,
            camera: ArcRotateCamera,
            private joystick: TouchJoystick
      ) {
            this.camera = camera;

            // Lock camera to portrait-friendly angle
            this.camera.alpha = -Math.PI / 2;
            this.camera.beta = Math.PI / 3.5;  // ~51° from top (45-ish)
            this.camera.radius = 22;

            // Tighter limits for portrait
            this.camera.lowerRadiusLimit = 15;
            this.camera.upperRadiusLimit = 35;
            this.camera.lowerBetaLimit = Math.PI / 4;    // 45° min
            this.camera.upperBetaLimit = Math.PI / 2.8;  // ~64° max
            this.camera.lowerAlphaLimit = null;
            this.camera.upperAlphaLimit = null;

            // Detach default controls — we handle input ourselves
            this.camera.detachControl();

            // Subscribe to joystick movement
            this.joystick.onMove.add((dir: Vector2) => {
                  this.handleJoystickMove(dir);
            });

            // Register update loop
            this.scene.onBeforeRenderObservable.add(() => {
                  this.update();
            });

            console.log("[PortraitCamera] Initialized ✓");
      }

      private handleJoystickMove(dir: Vector2): void {
            if (dir.length() < 0.05) return;

            // Convert 2D joystick to 3D world movement
            // Forward = -Z in Babylon default, Right = +X
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

            const movement = forward.scale(-dir.y * this.moveSpeed)
                  .add(right.scale(dir.x * this.moveSpeed));

            this.targetPosition.addInPlace(movement);

            // Clamp to world bounds
            this.targetPosition.x = Math.max(-80, Math.min(80, this.targetPosition.x));
            this.targetPosition.z = Math.max(-80, Math.min(80, this.targetPosition.z));
      }

      private update(): void {
            // Smooth follow
            this.followTarget.x += (this.targetPosition.x - this.followTarget.x) * this.smoothing;
            this.followTarget.z += (this.targetPosition.z - this.followTarget.z) * this.smoothing;
            this.followTarget.y = 3; // Fixed height target

            this.camera.target.copyFrom(this.followTarget);
      }

      public getWorldPosition(): Vector3 {
            return this.targetPosition.clone();
      }

      public setMoveSpeed(speed: number): void {
            this.moveSpeed = speed;
      }

      public dispose(): void {
            // Clean up
      }
}
