import { Scene } from "@babylonjs/core/scene";
import { Vector3, Matrix } from "@babylonjs/core/Maths/math";

type DmgType = "normal" | "crit" | "player" | "heal";

interface FloatingText {
      element: HTMLElement;
      elapsed: number;
      duration: number;
      startWorldPos: Vector3;
      randomOffset: number;
}

/**
 * FloatingDamage — DOM-based damage numbers that float up and fade
 * Matches 3D world position to 2D screen coordinates
 */
export class FloatingDamage {
      private scene: Scene;
      private active: FloatingText[] = [];
      private container!: HTMLElement;

      constructor(scene: Scene) {
            this.scene = scene;

            this.container = document.createElement("div");
            this.container.id = "floating-damage-layer";
            this.container.style.position = "absolute";
            this.container.style.top = "0";
            this.container.style.left = "0";
            this.container.style.width = "100%";
            this.container.style.height = "100%";
            this.container.style.pointerEvents = "none";
            this.container.style.zIndex = "45"; // Below main UI panels, above game canvas
            this.container.style.overflow = "hidden";

            const uiLayer = document.getElementById("ui-layer") || document.body;
            uiLayer.appendChild(this.container);
      }

      public spawn(position: Vector3, amount: number, type: DmgType = "normal"): void {
            const colors: Record<DmgType, string> = {
                  normal: "#ffffff",
                  crit: "#ffcc00", // Yellowish gold
                  player: "#ff4444", // Red damage taken
                  heal: "#44ff88", // Green healing
            };

            const prefix: Record<DmgType, string> = {
                  normal: "",
                  crit: "CRIT ",
                  player: "-",
                  heal: "+",
            };

            const el = document.createElement("div");
            el.innerText = `${prefix[type]}${amount}`;

            // Core styling
            el.style.position = "absolute";
            el.style.color = colors[type];
            el.style.fontSize = type === "crit" ? "28px" : "22px";
            el.style.fontFamily = "'Inter', sans-serif";
            el.style.fontWeight = "900";
            el.style.textShadow = "0 2px 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.6)";
            el.style.pointerEvents = "none";
            el.style.transform = "translate(-50%, -50%)"; // Center point
            el.style.userSelect = "none";
            el.style.willChange = "transform, opacity, left, top";

            this.container.appendChild(el);

            this.active.push({
                  element: el,
                  elapsed: 0,
                  duration: 0.8,
                  startWorldPos: position.clone(),
                  randomOffset: (Math.random() - 0.5) * 50 // -25px to 25px drift
            });
      }

      public update(dt: number): void {
            const engine = this.scene.getEngine();
            const camera = this.scene.activeCamera;
            if (!camera) return;

            const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            const transformMatrix = this.scene.getTransformMatrix();
            const identityMatrix = Matrix.Identity();

            for (let i = this.active.length - 1; i >= 0; i--) {
                  const ft = this.active[i];
                  ft.elapsed += dt;
                  const t = ft.elapsed / ft.duration;

                  if (t >= 1) {
                        if (ft.element.parentNode) {
                              ft.element.parentNode.removeChild(ft.element);
                        }
                        this.active.splice(i, 1);
                        continue;
                  }

                  // ── Screen Position Projection ──
                  const screenPos = Vector3.Project(
                        ft.startWorldPos,
                        identityMatrix, // World matrix is identity since startWorldPos is already global D3 pos
                        transformMatrix, // view x projection
                        viewport
                  );

                  // Only render if in front of camera (z > 0 and z < 1)
                  if (screenPos.z >= 0 && screenPos.z <= 1) {
                        ft.element.style.display = "block";

                        // Apply animation offsets: float UP and scale DOWN, fade OUT
                        const floatY = t * 60; // Float up by 60 pixels
                        const driftX = ft.randomOffset * t; // Drift sideways slightly

                        ft.element.style.left = `${screenPos.x + driftX}px`;
                        ft.element.style.top = `${screenPos.y - floatY}px`;

                        const scale = t < 0.2 ? 1 + t : Math.max(0.5, 1.2 - t * 0.7);
                        ft.element.style.transform = `translate(-50%, -50%) scale(${scale})`;

                        // Fade
                        const alpha = t < 0.3 ? 1 : Math.max(0, 1 - ((t - 0.3) / 0.7));
                        ft.element.style.opacity = alpha.toString();
                  } else {
                        ft.element.style.display = "none";
                  }
            }
      }

      public dispose(): void {
            this.active.forEach(ft => {
                  if (ft.element.parentNode) {
                        ft.element.parentNode.removeChild(ft.element);
                  }
            });
            this.active = [];

            if (this.container && this.container.parentNode) {
                  this.container.parentNode.removeChild(this.container);
            }
      }
}
