import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

export class EngineManager {
      private static _engine: AbstractEngine;
      private static _canvas: HTMLCanvasElement;

      static get engine(): AbstractEngine {
            return EngineManager._engine;
      }

      static async init(canvas: HTMLCanvasElement): Promise<AbstractEngine> {
            EngineManager._canvas = canvas;

            // WebGPU 優先 → WebGL2 自動 fallback
            EngineManager._engine = await (async () => {
                  try {
                        const gpu = new WebGPUEngine(canvas, {
                              adaptToDeviceRatio: true,
                              antialias: true,
                        });
                        await gpu.initAsync();
                        console.log("[Engine] WebGPU ✅");
                        return gpu;
                  } catch {
                        console.log("[Engine] WebGL2 fallback");
                        return new Engine(canvas, true, {
                              adaptToDeviceRatio: true,
                              antialias: true,
                        });
                  }
            })();

            EngineManager._setupResize();
            EngineManager._lockPortrait();

            return EngineManager._engine;
      }

      private static _setupResize(): void {
            const onResize = () => EngineManager._engine.resize();
            window.addEventListener("resize", onResize);
            window.addEventListener("orientationchange", () => {
                  setTimeout(onResize, 200);
            });
      }

      private static _lockPortrait(): void {
            try {
                  const ori = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
                  if (ori?.lock) {
                        ori.lock("portrait").catch(() => {
                              // 桌面瀏覽器不支援，忽略
                        });
                  }
            } catch {
                  // 靜默失敗
            }
      }

      static dispose(): void {
            EngineManager._engine?.dispose();
      }
}
