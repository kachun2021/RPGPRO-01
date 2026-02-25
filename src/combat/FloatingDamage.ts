import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";

type DmgType = "normal" | "crit" | "player" | "heal";

interface FloatingText {
      plane: Mesh;
      ui: AdvancedDynamicTexture;
      text: TextBlock;
      elapsed: number;
      duration: number;
      startY: number;
}

/**
 * FloatingDamage — World-space damage numbers that float up and fade
 */
export class FloatingDamage {
      private scene: Scene;
      private active: FloatingText[] = [];

      constructor(scene: Scene) {
            this.scene = scene;
      }

      public spawn(position: Vector3, amount: number, type: DmgType = "normal"): void {
            const plane = MeshBuilder.CreatePlane("dmgPlane", { width: 2, height: 0.6 }, this.scene);
            plane.position.copyFrom(position);
            plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
            plane.isPickable = false;

            const ui = AdvancedDynamicTexture.CreateForMesh(plane, 256, 64);

            const colors: Record<DmgType, string> = {
                  normal: "#ffffff",
                  crit: "#ffcc00",
                  player: "#ff4444",
                  heal: "#44ff88",
            };

            const prefix: Record<DmgType, string> = {
                  normal: "",
                  crit: "CRIT ",
                  player: "-",
                  heal: "+",
            };

            const text = new TextBlock("dmgText", `${prefix[type]}${amount}`);
            text.color = colors[type];
            text.fontSize = type === "crit" ? 42 : 32;
            text.fontFamily = "'Inter', sans-serif";
            text.fontWeight = "900";
            text.shadowColor = "rgba(0, 0, 0, 0.9)";
            text.shadowBlur = 6;
            ui.addControl(text);

            this.active.push({
                  plane, ui, text,
                  elapsed: 0,
                  duration: 0.8,
                  startY: position.y,
            });
      }

      public update(dt: number): void {
            for (let i = this.active.length - 1; i >= 0; i--) {
                  const ft = this.active[i];
                  ft.elapsed += dt;
                  const t = ft.elapsed / ft.duration;

                  if (t >= 1) {
                        ft.ui.dispose();
                        ft.plane.dispose();
                        this.active.splice(i, 1);
                        continue;
                  }

                  // Float up
                  ft.plane.position.y = ft.startY + t * 2.0;

                  // Scale down after 50%
                  if (t > 0.5) {
                        const shrink = 1 - (t - 0.5) * 2;
                        ft.plane.scaling.setAll(Math.max(0.1, shrink));
                  }

                  // Fade
                  const alpha = t < 0.3 ? 1 : Math.max(0, 1 - (t - 0.3) / 0.7);
                  ft.text.alpha = alpha;
            }
      }

      public dispose(): void {
            this.active.forEach(ft => {
                  ft.ui.dispose();
                  ft.plane.dispose();
            });
            this.active = [];
      }
}
