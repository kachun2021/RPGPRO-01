import { Scene } from "@babylonjs/core/scene";
import { Vector3, Color3, Color4 } from "@babylonjs/core/Maths/math";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

/**
 * PickupParticles — Gold sparkle burst on item collection
 */
export class PickupParticles {
      private scene: Scene;

      constructor(scene: Scene) {
            this.scene = scene;
      }

      /**
       * Spawn a gold sparkle burst at position
       */
      public emitGoldBurst(position: Vector3): void {
            this.emitBurst(position,
                  new Color4(1, 0.85, 0.2, 1),
                  new Color4(1, 0.6, 0, 0),
                  50
            );
      }

      /**
       * Spawn a cyan EXP burst at position
       */
      public emitExpBurst(position: Vector3): void {
            this.emitBurst(position,
                  new Color4(0.2, 0.8, 1, 1),
                  new Color4(0, 0.3, 0.8, 0),
                  40
            );
      }

      /**
       * Spawn a red HP burst at position
       */
      public emitHPBurst(position: Vector3): void {
            this.emitBurst(position,
                  new Color4(1, 0.2, 0.3, 1),
                  new Color4(0.8, 0, 0, 0),
                  35
            );
      }

      /**
       * Spawn a damage hit burst
       */
      public emitHitBurst(position: Vector3): void {
            this.emitBurst(position,
                  new Color4(1, 0.3, 0.1, 1),
                  new Color4(1, 0.1, 0, 0),
                  30
            );
      }

      private emitBurst(position: Vector3, color1: Color4, color2: Color4, count: number): void {
            // Create a temporary emitter
            const emitter = MeshBuilder.CreateBox("pEmitter", { size: 0.01 }, this.scene);
            emitter.position.copyFrom(position);
            emitter.isVisible = false;

            const ps = new ParticleSystem("pickupBurst", count, this.scene);
            ps.emitter = emitter;

            // Use simple default particle texture
            ps.createPointEmitter(new Vector3(-1, 1, -1), new Vector3(1, 3, 1));

            ps.minLifeTime = 0.3;
            ps.maxLifeTime = 0.7;
            ps.minSize = 0.05;
            ps.maxSize = 0.15;
            ps.minEmitPower = 2;
            ps.maxEmitPower = 5;

            ps.color1 = color1;
            ps.color2 = color2;
            ps.colorDead = new Color4(0, 0, 0, 0);

            ps.gravity = new Vector3(0, -5, 0);
            ps.emitRate = count * 5;
            ps.targetStopDuration = 0.15;

            ps.addSizeGradient(0, 0.15);
            ps.addSizeGradient(0.5, 0.1);
            ps.addSizeGradient(1.0, 0);

            // Blend mode for glow
            ps.blendMode = ParticleSystem.BLENDMODE_ADD;

            ps.start();

            // Auto-dispose after burst
            setTimeout(() => {
                  ps.stop();
                  ps.dispose();
                  emitter.dispose();
            }, 1200);
      }
}
