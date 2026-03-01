import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import type { Engine } from '@babylonjs/core/Engines/engine';

export class LandscapeCamera {
      public camera: ArcRotateCamera;
      private _target = Vector3.Zero();

      constructor(scene: Scene, canvas: HTMLCanvasElement) {
            this.camera = new ArcRotateCamera('cam', -Math.PI / 2, 1.1, 14, Vector3.Zero(), scene);
            this.camera.lowerBetaLimit = 0.5;
            this.camera.upperBetaLimit = 1.4;
            this.camera.lowerRadiusLimit = 8;
            this.camera.upperRadiusLimit = 25;
            this.camera.panningSensibility = 0;
            this.camera.wheelDeltaPercentage = 0.02;
            this.camera.attachControl(canvas, true);

            // Right-click rotate only
            (this.camera.inputs.attached.pointers as any).buttons = [1];
      }

      /** Smoothly follow a target position */
      update(dt: number, targetPos: Vector3): void {
            this._target.copyFrom(targetPos);
            this._target.y += 1.0; // Look at chest height
            Vector3.LerpToRef(this.camera.target, this._target, Math.min(5 * dt, 1), this.camera.target);
      }

      dispose(): void {
            this.camera.dispose();
      }
}
