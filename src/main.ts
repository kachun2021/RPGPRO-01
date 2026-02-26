// Side-effect imports: register engine capabilities stripped by tree-shaking
// Standard WebGL2 engine extensions
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/Extensions/engine.rawTexture";
// WebGPU engine extensions (needed when WebGPU is primary)
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.rawTexture";
// Rendering pipeline components
import "@babylonjs/core/Rendering/prePassRendererSceneComponent";
import "@babylonjs/core/Rendering/subSurfaceSceneComponent";

import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { MainScene } from "./scenes/MainScene";

class Game {
     private engine!: AbstractEngine;
     private mainScene!: MainScene;
     private canvas: HTMLCanvasElement;

     constructor() {
          this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
          if (!this.canvas) throw new Error("Canvas #gameCanvas not found");
          this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
          this.init().catch((err) => {
               console.error("[Game] Fatal init error:", err);
          });
     }

     private async init(): Promise<void> {
          const loadingBar = document.getElementById("loadingBar") as HTMLElement;
          const setProgress = (pct: number) => {
               if (loadingBar) loadingBar.style.width = `${pct}%`;
          };

          setProgress(10);

          // Try WebGPU first, fallback to WebGL2
          let engineType = "WebGL2";
          try {
               const webgpu = new WebGPUEngine(this.canvas, {
                    adaptToDeviceRatio: true,
                    antialias: true,
                    stencil: true,
               });
               await webgpu.initAsync();
               // Do NOT use setHardwareScalingLevel with adaptToDeviceRatio. It squares the multiplier.
               this.engine = webgpu;
               engineType = "WebGPU";
          } catch (e) {
               console.warn("[Engine] WebGPU failed, falling back to WebGL2:", e);
               this.engine = new Engine(this.canvas, true, {
                    stencil: true,
                    preserveDrawingBuffer: true,
               }, true); // 4th arg is adaptToDeviceRatio
               // Do NOT use setHardwareScalingLevel(1/dpr) here either.
          }


          setProgress(30);

          // Resize handling
          this.handleResize();
          window.addEventListener("resize", () => this.handleResize());
          window.addEventListener("orientationchange", () => {
               setTimeout(() => this.handleResize(), 200);
          });

          setProgress(40);

          // Create the main blood moon scene
          try {
               this.mainScene = new MainScene(this.engine, this.canvas);
               await this.mainScene.init();
          } catch (e) {
               console.error("[Game] Scene init failed:", e);
               throw e;
          }

          setProgress(90);

          // Start render loop with FPS counter
          let frameCount = 0;
          let lastFpsTime = performance.now();
          this.engine.runRenderLoop(() => {
               this.mainScene.render();
               frameCount++;
               const now = performance.now();
               if (now - lastFpsTime >= 3000) {
                    const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
                    console.log(`[Perf] FPS: ${fps}`);
                    frameCount = 0;
                    lastFpsTime = now;
               }
          });

          setProgress(100);

          // Fade out loading screen
          setTimeout(() => {
               const loadingScreen = document.getElementById("loading-screen");
               if (loadingScreen) {
                    loadingScreen.classList.add("fade-out");
                    setTimeout(() => loadingScreen.remove(), 800);
               }
          }, 400);
     }

     private handleResize(): void {
          this.engine.resize();
          // Force Super Sampling Anti-Aliasing (SSAA)
          // Desktop monitors (devicePixelRatio=1) will now render internally at 2x resolution
          // Mobile Retina screens (devicePixelRatio=2 or 3) will render at their 2x/3x resolution
          // This ensures perfect smoothness on the 3D models and character edges at all times.
          const dpr = Math.max(window.devicePixelRatio || 1, 2.0);
          this.engine.setHardwareScalingLevel(1 / Math.min(dpr, 3.0));
     }
}

// Boot
window.addEventListener("DOMContentLoaded", () => {
     new Game();
});
