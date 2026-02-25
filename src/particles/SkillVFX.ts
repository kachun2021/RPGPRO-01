import { Scene } from "@babylonjs/core/scene";
import { Vector3, Color3, Color4 } from "@babylonjs/core/Maths/math";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { AssetManager } from "../core/AssetManager";

type VFXType = "slash" | "dash" | "lightning" | "frost" | "explosion";

/**
 * SkillVFX — Per-skill particle effects
 * Tries loading KTX2 textures, falls back to procedural
 */
export class SkillVFX {
      private scene: Scene;
      private textures = new Map<string, Texture>();

      constructor(scene: Scene) {
            this.scene = scene;
            this.preloadTextures();
      }

      private async preloadTextures(): Promise<void> {
            const types = ["slash", "lightning", "frost", "explosion", "dash"];
            for (const t of types) {
                  const tex = await AssetManager.loadTexture(this.scene, `assets/textures/vfx/skill_${t}.ktx2`);
                  if (tex) this.textures.set(t, tex);
            }
      }

      private getTexture(type: string): Texture {
            return this.textures.get(type) || this.createProceduralTexture(type);
      }

      private createProceduralTexture(type: string): Texture {
            const size = 64;
            const canvas = document.createElement("canvas");
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext("2d")!;

            const colors: Record<string, string[]> = {
                  slash: ["rgba(255,200,100,1)", "rgba(255,80,30,0.6)", "rgba(200,30,10,0)"],
                  dash: ["rgba(100,200,255,1)", "rgba(50,120,255,0.6)", "rgba(20,50,200,0)"],
                  lightning: ["rgba(255,255,200,1)", "rgba(255,220,80,0.7)", "rgba(200,180,0,0)"],
                  frost: ["rgba(180,230,255,1)", "rgba(80,180,255,0.6)", "rgba(20,80,200,0)"],
                  explosion: ["rgba(255,180,50,1)", "rgba(255,60,20,0.7)", "rgba(180,10,0,0)"],
            };

            const c = colors[type] || colors.slash;
            const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            grad.addColorStop(0, c[0]);
            grad.addColorStop(0.5, c[1]);
            grad.addColorStop(1, c[2]);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);

            return Texture.LoadFromDataString(`vfx_${type}`, canvas.toDataURL(), this.scene);
      }

      public playEffect(type: VFXType, position: Vector3): void {
            switch (type) {
                  case "slash": this.playSlash(position); break;
                  case "dash": this.playDash(position); break;
                  case "lightning": this.playLightning(position); break;
                  case "frost": this.playFrost(position); break;
                  case "explosion": this.playExplosion(position); break;
            }
      }

      // ── SLASH (Normal ATK) ─────────────────────────────────────────
      private playSlash(pos: Vector3): void {
            const ps = this.createBurst(pos, 30, {
                  color1: new Color4(1, 0.7, 0.3, 0.9),
                  color2: new Color4(1, 0.3, 0.1, 0.7),
                  minLife: 0.1, maxLife: 0.25,
                  minSize: 0.08, maxSize: 0.25,
                  minPower: 3, maxPower: 6,
                  dir1: new Vector3(-2, 1, -2), dir2: new Vector3(2, 3, 2),
                  gravity: new Vector3(0, -3, 0),
                  texture: "slash"
            });
            this.autoDispose(ps, 500);
      }

      // ── DASH (Dodge) ───────────────────────────────────────────────
      private playDash(pos: Vector3): void {
            const ps = this.createBurst(pos, 50, {
                  color1: new Color4(0.4, 0.8, 1, 0.8),
                  color2: new Color4(0.2, 0.5, 1, 0.5),
                  minLife: 0.15, maxLife: 0.35,
                  minSize: 0.05, maxSize: 0.2,
                  minPower: 2, maxPower: 8,
                  dir1: new Vector3(-1, 0, -3), dir2: new Vector3(1, 1, 3),
                  gravity: new Vector3(0, 0, 0),
                  texture: "dash"
            });
            this.autoDispose(ps, 600);
      }

      // ── LIGHTNING (Storm Strike) ───────────────────────────────────
      private playLightning(pos: Vector3): void {
            const ps = this.createBurst(pos.add(new Vector3(0, 3, 0)), 60, {
                  color1: new Color4(1, 1, 0.8, 1),
                  color2: new Color4(1, 0.9, 0.3, 0.8),
                  minLife: 0.2, maxLife: 0.5,
                  minSize: 0.05, maxSize: 0.3,
                  minPower: 5, maxPower: 12,
                  dir1: new Vector3(-0.5, -8, -0.5), dir2: new Vector3(0.5, -2, 0.5),
                  gravity: new Vector3(0, -15, 0),
                  texture: "lightning"
            });
            this.autoDispose(ps, 800);

            // Flash overlay
            this.flash(new Color3(1, 0.95, 0.7), 0.15);
      }

      // ── FROST (Frost Nova AOE) ─────────────────────────────────────
      private playFrost(pos: Vector3): void {
            const ps = this.createBurst(pos.add(new Vector3(0, 0.5, 0)), 80, {
                  color1: new Color4(0.7, 0.9, 1, 0.9),
                  color2: new Color4(0.3, 0.7, 1, 0.6),
                  minLife: 0.3, maxLife: 0.7,
                  minSize: 0.1, maxSize: 0.4,
                  minPower: 4, maxPower: 10,
                  dir1: new Vector3(-5, 0.5, -5), dir2: new Vector3(5, 2, 5),
                  gravity: new Vector3(0, -1, 0),
                  texture: "frost"
            });
            this.autoDispose(ps, 1000);
      }

      // ── EXPLOSION (Ultimate) ───────────────────────────────────────
      private playExplosion(pos: Vector3): void {
            // Main blast
            const ps = this.createBurst(pos.add(new Vector3(0, 1, 0)), 120, {
                  color1: new Color4(1, 0.6, 0.1, 1),
                  color2: new Color4(1, 0.2, 0.05, 0.8),
                  minLife: 0.4, maxLife: 1.0,
                  minSize: 0.2, maxSize: 0.8,
                  minPower: 6, maxPower: 15,
                  dir1: new Vector3(-6, 2, -6), dir2: new Vector3(6, 8, 6),
                  gravity: new Vector3(0, -5, 0),
                  texture: "explosion"
            });
            this.autoDispose(ps, 1500);

            // Secondary ring
            const ring = this.createBurst(pos, 50, {
                  color1: new Color4(1, 0.8, 0.2, 0.7),
                  color2: new Color4(1, 0.4, 0, 0.4),
                  minLife: 0.3, maxLife: 0.6,
                  minSize: 0.15, maxSize: 0.5,
                  minPower: 8, maxPower: 14,
                  dir1: new Vector3(-8, 0, -8), dir2: new Vector3(8, 1, 8),
                  gravity: new Vector3(0, -2, 0),
                  texture: "explosion"
            });
            this.autoDispose(ring, 1000);

            // Flash
            this.flash(new Color3(1, 0.6, 0.2), 0.25);
      }

      // ── HELPERS ────────────────────────────────────────────────────

      private createBurst(
            pos: Vector3, count: number,
            opts: {
                  color1: Color4; color2: Color4;
                  minLife: number; maxLife: number;
                  minSize: number; maxSize: number;
                  minPower: number; maxPower: number;
                  dir1: Vector3; dir2: Vector3;
                  gravity: Vector3;
                  texture: string;
            }
      ): ParticleSystem {
            const emitter = MeshBuilder.CreateBox("vfxEmitter", { size: 0.01 }, this.scene);
            emitter.position.copyFrom(pos);
            emitter.isVisible = false;

            const ps = new ParticleSystem(`vfx_${opts.texture}`, count, this.scene);
            ps.emitter = emitter;
            ps.particleTexture = this.getTexture(opts.texture);

            ps.color1 = opts.color1;
            ps.color2 = opts.color2;
            ps.colorDead = new Color4(0, 0, 0, 0);

            ps.minLifeTime = opts.minLife;
            ps.maxLifeTime = opts.maxLife;
            ps.minSize = opts.minSize;
            ps.maxSize = opts.maxSize;
            ps.minEmitPower = opts.minPower;
            ps.maxEmitPower = opts.maxPower;

            ps.direction1 = opts.dir1;
            ps.direction2 = opts.dir2;
            ps.gravity = opts.gravity;

            ps.blendMode = ParticleSystem.BLENDMODE_ADD;
            ps.emitRate = count * 5;
            ps.targetStopDuration = 0.1;

            ps.addSizeGradient(0, opts.maxSize);
            ps.addSizeGradient(0.5, opts.maxSize * 0.6);
            ps.addSizeGradient(1.0, 0);

            ps.start();
            return ps;
      }

      private autoDispose(ps: ParticleSystem, ms: number): void {
            setTimeout(() => {
                  ps.stop();
                  const emitter = ps.emitter;
                  setTimeout(() => {
                        ps.dispose();
                        if (emitter && typeof (emitter as any).dispose === "function") {
                              (emitter as any).dispose();
                        }
                  }, 500);
            }, ms);
      }

      private flash(color: Color3, duration: number): void {
            const orig = this.scene.clearColor.clone();
            this.scene.clearColor.r = color.r * 0.3;
            this.scene.clearColor.g = color.g * 0.3;
            this.scene.clearColor.b = color.b * 0.3;
            setTimeout(() => {
                  this.scene.clearColor = orig;
            }, duration * 1000);
      }

      public dispose(): void {
            // textures are managed by scene
      }
}
