import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

/**
 * PortraitCamera — 直向手機最佳化鏡頭
 * ✅ 修復：不使用 attachControl + removeByType（會干擾事件處理）
 * 改為純粹的跟隨鏡頭，不附加任何輸入控制
 */
export class PortraitCamera {
      private _camera: ArcRotateCamera;
      private _lerpSpeed = 8;  // 加快跟隨速度

      constructor(scene: Scene, _canvas: HTMLCanvasElement) {
            this._camera = new ArcRotateCamera(
                  "portraitCam",
                  -Math.PI / 2,  // alpha: camera behind player (south direction)
                  1.05,          // beta: 俯瞰角（60° 俯視感）
                  12,            // radius: 12m 距離
                  Vector3.Zero(),
                  scene
            );
            this._camera.fov = (72 * Math.PI) / 180; // 72° 更廣 portrait 視角
            this._camera.minZ = 0.1;   // 避免近裁切
            this._camera.maxZ = 2000;  // 遠裁切距離

            // Hard limits for portrait mode
            this._camera.lowerRadiusLimit = 8;
            this._camera.upperRadiusLimit = 18;
            this._camera.lowerBetaLimit = 0.4;
            this._camera.upperBetaLimit = 1.35;

            // ✅ 修復：不 attachControl，不 removeByType
            // 純跟隨鏡頭，由 update() 直接控制 target
            // 這樣不會攔截任何輸入事件
      }

      get camera(): ArcRotateCamera { return this._camera; }

      /** Smooth follow player position — call every frame */
      update(targetPos: Vector3, dt: number): void {
            const t = Math.min(1, this._lerpSpeed * dt);
            this._camera.target = Vector3.Lerp(this._camera.target, targetPos, t);
      }

      dispose(): void {
            this._camera?.dispose();
      }
}
