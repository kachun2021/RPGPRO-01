import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

/**
 * Portrait-optimized camera.
 * FOV 65°, beta 1.2, radius 12, lerp towards player position.
 */
export class PortraitCamera {
      private _camera: ArcRotateCamera;
      private _lerpSpeed = 5;

      constructor(scene: Scene, canvas: HTMLCanvasElement) {
            this._camera = new ArcRotateCamera(
                  "portraitCam",
                  Math.PI / 2,  // alpha — side view
                  1.0,           // beta — more overhead for portrait 俯瞰感
                  10,            // radius — slightly closer
                  Vector3.Zero(),
                  scene
            );
            this._camera.fov = (70 * Math.PI) / 180; // 70° 更廣視角
            this._camera.lowerRadiusLimit = 7;
            this._camera.upperRadiusLimit = 16;
            this._camera.lowerBetaLimit = 0.5;
            this._camera.upperBetaLimit = 1.3;

            // Disable default pointer input (joystick handles movement)
            this._camera.attachControl(canvas, false);
            this._camera.inputs.removeByType("ArcRotateCameraPointersInput");
      }

      get camera(): ArcRotateCamera { return this._camera; }

      /** Smooth follow player position */
      update(targetPos: Vector3, dt: number): void {
            const t = Math.min(1, this._lerpSpeed * dt);
            this._camera.target = Vector3.Lerp(this._camera.target, targetPos, t);
      }

      dispose(): void {
            this._camera?.dispose();
      }
}
