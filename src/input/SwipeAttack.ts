import { Scene } from "@babylonjs/core/scene";
import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3, Color4 } from "@babylonjs/core/Maths/math";
import { InputManager, SwipeData } from "./InputManager";
import { AssetManager } from "../core/AssetManager";

/**
 * Swipe Attack Gesture System
 * Detects right-side swipes and spawns motion trail particles.
 * Loads swipe trail texture from AssetManager (placeholder graceful fallback).
 */
export class SwipeAttack {
      private scene: Scene;
      private trailParticles: ParticleSystem | null = null;

      constructor(scene: Scene, inputManager: InputManager) {
            this.scene = scene;

            inputManager.onSwipeAttack.add((data: SwipeData) => {
                  this.onSwipe(data);
            });

            this.createTrailSystem();

      }

      private onSwipe(data: SwipeData): void {
            // Determine attack type by direction
            const dir = data.direction;
            let attackType = "slash";

            if (Math.abs(dir.x) > Math.abs(dir.y)) {
                  attackType = dir.x > 0 ? "slash_right" : "slash_left";
            } else {
                  attackType = dir.y > 0 ? "slash_down" : "slash_up";
            }

            // Scale damage by velocity
            const damageMultiplier = Math.min(data.velocity * 2, 3.0);


            // Trigger trail effect
            this.spawnTrail(data);
      }

      private createTrailSystem(): void {
            this.trailParticles = new ParticleSystem("swipeTrail", 300, this.scene);

            // Try loading trail texture from AssetManager, fallback to procedural
            AssetManager.loadTexture(this.scene, "assets/ui/swipe_trail.ktx2").then((tex) => {
                  if (tex && this.trailParticles) {
                        this.trailParticles.particleTexture = tex;

                  } else if (this.trailParticles) {
                        this.trailParticles.particleTexture = this.createTrailTexture();

                  }
            });

            this.trailParticles.emitter = Vector3.Zero();
            this.trailParticles.minLifeTime = 0.15;
            this.trailParticles.maxLifeTime = 0.4;
            this.trailParticles.emitRate = 0; // manual burst
            this.trailParticles.minSize = 0.1;
            this.trailParticles.maxSize = 0.4;
            this.trailParticles.color1 = new Color4(1, 0.3, 0.1, 0.9);
            this.trailParticles.color2 = new Color4(1, 0.5, 0.2, 0.7);
            this.trailParticles.colorDead = new Color4(0.8, 0.1, 0.05, 0);
            this.trailParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
            this.trailParticles.gravity = new Vector3(0, -2, 0);
            this.trailParticles.direction1 = new Vector3(-1, 0, -1);
            this.trailParticles.direction2 = new Vector3(1, 2, 1);
            this.trailParticles.minEmitPower = 1;
            this.trailParticles.maxEmitPower = 3;
            this.trailParticles.updateSpeed = 0.01;
            this.trailParticles.start();
      }

      private spawnTrail(data: SwipeData): void {
            if (!this.trailParticles) return;

            // Burst particles at camera target position
            const camera = this.scene.activeCamera;
            if (camera) {
                  this.trailParticles.emitter = (camera as any).target || Vector3.Zero();
            }

            // Manual burst
            this.trailParticles.manualEmitCount = 30;

            // Brief high emit rate
            this.trailParticles.emitRate = 150;
            setTimeout(() => {
                  if (this.trailParticles) this.trailParticles.emitRate = 0;
            }, 200);
      }

      private createTrailTexture(): Texture {
            const size = 64;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d")!;

            // Elongated slash mark
            const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            grad.addColorStop(0, "rgba(255, 200, 100, 1)");
            grad.addColorStop(0.3, "rgba(255, 100, 50, 0.8)");
            grad.addColorStop(0.7, "rgba(255, 50, 20, 0.3)");
            grad.addColorStop(1, "rgba(200, 20, 10, 0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);

            return Texture.LoadFromDataString("swipeTrailTex", canvas.toDataURL(), this.scene);
      }

      public dispose(): void {
            this.trailParticles?.dispose();
      }
}
