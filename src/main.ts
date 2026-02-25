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
               console.log(`[Loading] ${pct}%`);
          };

          setProgress(10);

          // Try WebGPU first, fallback to WebGL2
          // Force high-DPI rendering
          const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for perf
          let engineType = "WebGL2";
          try {
               const webgpu = new WebGPUEngine(this.canvas, {
                    adaptToDeviceRatio: true,
                    antialias: true,
                    stencil: true,
               });
               await webgpu.initAsync();
               webgpu.setHardwareScalingLevel(1 / dpr);
               this.engine = webgpu;
               engineType = "WebGPU";
          } catch (e) {
               console.warn("[Engine] WebGPU failed, falling back to WebGL2:", e);
               this.engine = new Engine(this.canvas, true, {
                    adaptToDeviceRatio: true,
                    antialias: true,
                    stencil: true,
               });
               this.engine.setHardwareScalingLevel(1 / dpr);
          }
          console.log(`[Engine] ${engineType} initialized ✓`);

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
               console.log("[Game] MainScene constructed, calling init...");
               await this.mainScene.init();
               console.log("[Game] MainScene init complete ✓");
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
     }
}

// Boot
window.addEventListener("DOMContentLoaded", () => {
     new Game();
});
