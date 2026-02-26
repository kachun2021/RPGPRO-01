import { EngineManager } from "./core/EngineManager";
import { MainScene } from "./scenes/MainScene";

// ── Loading screen helpers ──────────────────────────────────────────────────
function setLoadingProgress(pct: number, text: string): void {
      const bar = document.getElementById("loadingBar");
      const label = document.querySelector(".loading-text") as HTMLElement | null;
      if (bar) bar.style.width = `${pct}%`;
      if (label) label.textContent = text;
}

function hideLoadingScreen(): void {
      const screen = document.getElementById("loading-screen");
      if (!screen) return;
      screen.style.transition = "opacity 0.8s ease-out";
      screen.style.opacity = "0";
      setTimeout(() => { screen.style.display = "none"; }, 850);
}

// ── Boot ────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
      const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
      if (!canvas) {
            console.error("[Boot] #gameCanvas not found");
            return;
      }

      try {
            setLoadingProgress(10, "INITIALISING ENGINE...");

            // 1. Engine
            const engine = await EngineManager.init(canvas);
            setLoadingProgress(30, "BUILDING WORLD...");

            // 2. Scene
            const mainScene = new MainScene(engine, canvas);
            await mainScene.init();
            setLoadingProgress(90, "ENTERING THE PHANTOM DOMINION...");

            // 3. Render loop
            mainScene.render();
            setLoadingProgress(100, "READY");

            // 4. Hide loading screen
            setTimeout(hideLoadingScreen, 400);

            // 5. FPS monitor every 3s
            setInterval(() => {
                  console.log(`[FPS] ${engine.getFps().toFixed(1)}`);
            }, 3000);

      } catch (err) {
            console.error("[Boot] Fatal error:", err);
            setLoadingProgress(0, "ERROR — CHECK CONSOLE");
      }
});
