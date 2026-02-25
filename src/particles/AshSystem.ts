import { Scene } from "@babylonjs/core/scene";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3, Color4 } from "@babylonjs/core/Maths/math";

export class AshParticleSystem {
     public static create(scene: Scene): ParticleSystem {
          const ps = new ParticleSystem("ashParticles", 2000, scene);

          // Generate particle texture procedurally
          ps.particleTexture = AshParticleSystem.createAshTexture(scene);

          // Emitter - wide area box
          ps.emitter = Vector3.Zero();
          ps.minEmitBox = new Vector3(-50, 0, -50);
          ps.maxEmitBox = new Vector3(50, 0.5, 50);

          // Lifetime
          ps.minLifeTime = 4;
          ps.maxLifeTime = 10;

          // Emission rate
          ps.emitRate = 150;

          // Size
          ps.minSize = 0.02;
          ps.maxSize = 0.12;

          // Direction - upward drift with some turbulence
          ps.direction1 = new Vector3(-0.3, 1.5, -0.3);
          ps.direction2 = new Vector3(0.3, 3, 0.3);

          // Gravity - very light upward pull
          ps.gravity = new Vector3(0, 0.05, 0);

          // Angular speed (tumbling ash)
          ps.minAngularSpeed = -1.5;
          ps.maxAngularSpeed = 1.5;

          // Speed
          ps.minEmitPower = 0.3;
          ps.maxEmitPower = 1.2;
          ps.updateSpeed = 0.008;

          // Color gradient: dark ember → bright ember → fade
          ps.color1 = new Color4(0.8, 0.15, 0.05, 0.9);
          ps.color2 = new Color4(1, 0.3, 0.08, 0.7);
          ps.colorDead = new Color4(0.15, 0.02, 0.01, 0);

          // Blend mode
          ps.blendMode = ParticleSystem.BLENDMODE_ADD;

          // Size over life - grow then shrink
          ps.addSizeGradient(0, 0.02, 0.04);
          ps.addSizeGradient(0.3, 0.06, 0.12);
          ps.addSizeGradient(0.7, 0.08, 0.1);
          ps.addSizeGradient(1.0, 0.01, 0.02);

          // Alpha over life
          ps.addColorGradient(0, new Color4(0.3, 0.05, 0.02, 0));
          ps.addColorGradient(0.1, new Color4(0.8, 0.12, 0.04, 0.8));
          ps.addColorGradient(0.5, new Color4(1, 0.25, 0.06, 0.6));
          ps.addColorGradient(0.8, new Color4(0.6, 0.08, 0.03, 0.3));
          ps.addColorGradient(1.0, new Color4(0.1, 0.01, 0.01, 0));

          ps.start();

          // Secondary system: slower, larger ash flakes
          const ps2 = new ParticleSystem("ashFlakes", 500, scene);
          ps2.particleTexture = ps.particleTexture;
          ps2.emitter = Vector3.Zero();
          ps2.minEmitBox = new Vector3(-40, 0, -40);
          ps2.maxEmitBox = new Vector3(40, 2, 40);
          ps2.minLifeTime = 6;
          ps2.maxLifeTime = 14;
          ps2.emitRate = 40;
          ps2.minSize = 0.05;
          ps2.maxSize = 0.2;
          ps2.direction1 = new Vector3(-0.5, 0.8, -0.5);
          ps2.direction2 = new Vector3(0.5, 2, 0.5);
          ps2.gravity = new Vector3(0.02, 0.02, 0);
          ps2.minAngularSpeed = -2;
          ps2.maxAngularSpeed = 2;
          ps2.minEmitPower = 0.1;
          ps2.maxEmitPower = 0.5;
          ps2.updateSpeed = 0.006;
          ps2.color1 = new Color4(0.4, 0.06, 0.03, 0.5);
          ps2.color2 = new Color4(0.6, 0.1, 0.04, 0.4);
          ps2.colorDead = new Color4(0.05, 0.01, 0.005, 0);
          ps2.blendMode = ParticleSystem.BLENDMODE_ADD;
          ps2.start();

          return ps;
     }

     private static createAshTexture(scene: Scene): Texture {
          const size = 64;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d")!;

          // Radial gradient - soft glowing ember
          const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
          grad.addColorStop(0, "rgba(255, 200, 150, 1)");
          grad.addColorStop(0.3, "rgba(255, 120, 50, 0.8)");
          grad.addColorStop(0.6, "rgba(200, 50, 20, 0.4)");
          grad.addColorStop(1, "rgba(100, 20, 10, 0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, size, size);

          return Texture.LoadFromDataString("ashTex", canvas.toDataURL(), scene);
     }
}
