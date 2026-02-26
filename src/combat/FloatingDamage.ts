import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

interface FloatEntry {
      mesh: Mesh;
      mat: StandardMaterial;
      tex: DynamicTexture;
      life: number;
      vel: Vector3;
}

/**
 * FloatingDamage — DynamicTexture billboard numbers that float up and fade.
 * Supports: normal (yellow), crit (orange-red), heal (green).
 */
export class FloatingDamage {
      private _scene: Scene;
      private _active: FloatEntry[] = [];
      private _pool: FloatEntry[] = []; // reuse pool to reduce GC

      constructor(scene: Scene) {
            this._scene = scene;
      }

      /** Spawn a floating number at worldPos */
      spawn(worldPos: Vector3, amount: number, type: "normal" | "crit" | "heal" | "reaction" = "normal", label?: string): void {
            const entry = this._getEntry();
            const display = label ?? (type === "heal" ? `+${amount}` : `${amount}`);

            // Pick color
            let color = "#FFE030";
            let shadow = "#996600";
            if (type === "crit") { color = "#FF5020"; shadow = "#990000"; }
            if (type === "heal") { color = "#44EE66"; shadow = "#006622"; }
            if (type === "reaction") { color = "#FF88FF"; shadow = "#660066"; }

            // Draw on DynamicTexture
            const ctx = entry.tex.getContext() as unknown as CanvasRenderingContext2D;
            ctx.clearRect(0, 0, 128, 64);
            const fontSize = type === "crit" ? 36 : 28;
            ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
            ctx.shadowColor = shadow;
            ctx.shadowBlur = 8;
            ctx.fillStyle = color;
            ctx.textAlign = "center";
            ctx.fillText(display, 64, 44);
            entry.tex.update();

            // Reset entry
            entry.mesh.position.copyFrom(worldPos);
            entry.mesh.position.y += 1.2;
            entry.mesh.billboardMode = 7;
            entry.mesh.setEnabled(true);
            entry.mat.alpha = 1.0;
            entry.life = 0;
            entry.vel.set((Math.random() - 0.5) * 0.6, 1.6, (Math.random() - 0.5) * 0.6);

            this._active.push(entry);
      }

      update(dt: number): void {
            for (let i = this._active.length - 1; i >= 0; i--) {
                  const e = this._active[i];
                  e.life += dt;
                  const t = e.life / 1.0; // 1s lifetime

                  e.mesh.position.addInPlace(e.vel.scale(dt));
                  e.vel.y -= 1.4 * dt; // slight gravity
                  e.mat.alpha = Math.max(0, 1 - t * t);

                  if (e.life >= 1.0) {
                        e.mesh.setEnabled(false);
                        this._active.splice(i, 1);
                        this._pool.push(e); // return to pool
                  }
            }
      }

      private _getEntry(): FloatEntry {
            if (this._pool.length > 0) return this._pool.pop()!;

            const tex = new DynamicTexture("floatTex", { width: 128, height: 64 }, this._scene, false);
            tex.hasAlpha = true;
            const mesh = MeshBuilder.CreatePlane("floatDmg", { width: 1.6, height: 0.8 }, this._scene);
            const mat = new StandardMaterial("floatMat", this._scene);
            mat.diffuseTexture = tex;
            mat.emissiveTexture = tex;
            mat.useAlphaFromDiffuseTexture = true;
            mat.disableLighting = true;
            mat.backFaceCulling = false;
            mesh.material = mat;
            mesh.setEnabled(false);

            return { mesh, mat, tex, life: 0, vel: Vector3.Zero() };
      }

      dispose(): void {
            for (const e of [...this._active, ...this._pool]) {
                  e.tex.dispose();
                  e.mat.dispose();
                  e.mesh.dispose();
            }
            this._active = [];
            this._pool = [];
      }
}
