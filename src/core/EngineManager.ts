import { Engine } from '@babylonjs/core/Engines/engine';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';
import { Scene } from '@babylonjs/core/scene';
import { shouldUseReducedRenderQuality } from './RuntimeLaunchFlags';

export class EngineManager {
      public engine!: Engine | WebGPUEngine;
      public canvas!: HTMLCanvasElement;
      private _scene: Scene | null = null;

      async init(): Promise<void> {
            const reducedRenderMode = shouldUseReducedRenderQuality();
            this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
            if (!this.canvas) {
                  this.canvas = document.createElement('canvas');
                  this.canvas.id = 'renderCanvas';
                  this.canvas.style.width = '100%';
                  this.canvas.style.height = '100%';
                  this.canvas.style.position = 'absolute';
                  this.canvas.style.top = '0';
                  this.canvas.style.left = '0';
                  this.canvas.style.outline = 'none';
                  this.canvas.style.touchAction = 'none';
                  document.body.appendChild(this.canvas);
            }

            // WebGPU -> WebGL2 fallback
            this.engine = await (async () => {
                  if (!reducedRenderMode) {
                        try {
                              const gpu = new WebGPUEngine(this.canvas, {
                                    adaptToDeviceRatio: true,
                                    antialias: true,
                              });
                              await gpu.initAsync();
                              console.log('[EngineManager] WebGPU initialized');
                              return gpu;
                        } catch {
                              console.log('[EngineManager] WebGPU unavailable, falling back to WebGL2');
                        }
                  }

                  const fallback = new Engine(this.canvas, !reducedRenderMode, {
                        adaptToDeviceRatio: !reducedRenderMode,
                        antialias: !reducedRenderMode,
                  });
                  if (reducedRenderMode) {
                        console.log('[EngineManager] Reduced render mode active for automated smoke checks');
                  }
                  return fallback;
            })();

            const scaling = reducedRenderMode
                  ? Math.max(1.5, window.devicePixelRatio || 1)
                  : 1 / window.devicePixelRatio;
            this.engine.setHardwareScalingLevel(scaling);

            // Resize handler
            window.addEventListener('resize', () => {
                  this.engine.resize();
            });

            // Try landscape lock
            try {
                  await (screen.orientation as any).lock('landscape');
            } catch {
                  // Not supported on all browsers
            }
      }

      get scene(): Scene | null {
            return this._scene;
      }

      set scene(s: Scene | null) {
            this._scene = s;
      }

      startRenderLoop(): void {
            this.engine.runRenderLoop(() => {
                  if (this._scene) {
                        this._scene.render();
                  }
            });
      }

      dispose(): void {
            this.engine.stopRenderLoop();
            this._scene?.dispose();
            this.engine.dispose();
      }
}
