import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';

interface TouchCameraSettings {
      sensitivity?: number;
      invertY?: boolean;
}

export class LandscapeCamera {
      public camera: ArcRotateCamera;
      private _target = Vector3.Zero();
      private _canvas: HTMLCanvasElement;
      private _touchPointerId: number | null = null;
      private _touchLastX = 0;
      private _touchLastY = 0;
      private _touchSensitivity = 1;
      private _invertY = false;
      private _onPointerDown = (event: PointerEvent): void => {
            if (event.pointerType !== 'touch') return;
            if (event.clientX < window.innerWidth * 0.5) return;

            this._touchPointerId = event.pointerId;
            this._touchLastX = event.clientX;
            this._touchLastY = event.clientY;
            this._canvas.setPointerCapture(event.pointerId);
            event.preventDefault();
            event.stopPropagation();
      };
      private _onPointerMove = (event: PointerEvent): void => {
            if (this._touchPointerId !== event.pointerId) return;

            const dx = event.clientX - this._touchLastX;
            const dy = event.clientY - this._touchLastY;
            this._touchLastX = event.clientX;
            this._touchLastY = event.clientY;

            const rotateX = dx * 0.012 * this._touchSensitivity;
            const rotateY = dy * 0.009 * this._touchSensitivity * (this._invertY ? -1 : 1);

            this.camera.alpha -= rotateX;
            this.camera.beta = Math.max(
                  this.camera.lowerBetaLimit ?? 0.5,
                  Math.min(this.camera.upperBetaLimit ?? 1.4, this.camera.beta + rotateY),
            );

            event.preventDefault();
            event.stopPropagation();
      };
      private _onPointerUp = (event: PointerEvent): void => {
            if (this._touchPointerId !== event.pointerId) return;
            this._touchPointerId = null;
            if (this._canvas.hasPointerCapture(event.pointerId)) {
                  this._canvas.releasePointerCapture(event.pointerId);
            }
            event.preventDefault();
            event.stopPropagation();
      };

      constructor(scene: Scene, canvas: HTMLCanvasElement) {
            this._canvas = canvas;
            this.camera = new ArcRotateCamera('cam', -Math.PI / 2, 1.1, 14, Vector3.Zero(), scene);
            this.camera.lowerBetaLimit = 0.5;
            this.camera.upperBetaLimit = 1.4;
            this.camera.lowerRadiusLimit = 8;
            this.camera.upperRadiusLimit = 25;
            this.camera.panningSensibility = 0;
            this.camera.wheelDeltaPercentage = 0.02;
            this.camera.attachControl(canvas, true);

            // Keep desktop right-click orbit, but handle touch camera drag ourselves.
            (this.camera.inputs.attached.pointers as any).buttons = [1];
            canvas.addEventListener('pointerdown', this._onPointerDown, { capture: true });
            canvas.addEventListener('pointermove', this._onPointerMove, { capture: true });
            canvas.addEventListener('pointerup', this._onPointerUp, { capture: true });
            canvas.addEventListener('pointercancel', this._onPointerUp, { capture: true });
      }

      setTouchSettings(settings: TouchCameraSettings): void {
            if (typeof settings.sensitivity === 'number' && Number.isFinite(settings.sensitivity)) {
                  this._touchSensitivity = Math.max(0.5, Math.min(2, settings.sensitivity));
            }
            if (typeof settings.invertY === 'boolean') {
                  this._invertY = settings.invertY;
            }
      }

      /** Smoothly follow a target position */
      update(dt: number, targetPos: Vector3): void {
            this._target.copyFrom(targetPos);
            this._target.y += 1.0; // Look at chest height
            Vector3.LerpToRef(this.camera.target, this._target, Math.min(5 * dt, 1), this.camera.target);
      }

      dispose(): void {
            this._canvas.removeEventListener('pointerdown', this._onPointerDown, { capture: true } as EventListenerOptions);
            this._canvas.removeEventListener('pointermove', this._onPointerMove, { capture: true } as EventListenerOptions);
            this._canvas.removeEventListener('pointerup', this._onPointerUp, { capture: true } as EventListenerOptions);
            this._canvas.removeEventListener('pointercancel', this._onPointerUp, { capture: true } as EventListenerOptions);
            this.camera.dispose();
      }
}
