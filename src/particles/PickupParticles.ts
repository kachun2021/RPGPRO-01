import { GPUParticleSystem } from "@babylonjs/core/Particles/gpuParticleSystem";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

/**
 * 磁吸拾取特效 — 金紫色 GPUParticle 軌跡。
 * 預建（Prompt 2），P5 的 DropItem.ts 使用。
 */
export class PickupParticles {
      /**
       * Play a magnetic pickup trail from source → player.
       * Auto-disposes after 0.6s.
       */
      static play(scene: Scene, source: Vector3, target: AbstractMesh): void {
            // Prefer GPU particles, fallback to CPU
            let ps: GPUParticleSystem | ParticleSystem;
            const cap = 30;

            try {
                  ps = new GPUParticleSystem("pickupFx", { capacity: cap }, scene);
            } catch {
                  ps = new ParticleSystem("pickupFx", cap, scene);
            }

            // Placeholder particle texture (white circle)
            ps.particleTexture = new Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJklEQVQYV2P8////fwYiACNIAZZEZEVYFTBiUYRVATYT0RVhNREAx74Hsfh+JcUAAAAASUVORK5CYII=", scene);

            ps.emitter = source.clone();
            ps.minLifeTime = 0.3;
            ps.maxLifeTime = 0.6;
            ps.minSize = 0.08;
            ps.maxSize = 0.15;
            ps.emitRate = 60;

            // Gold → Purple gradient
            ps.color1 = new Color4(0.83, 0.66, 0.27, 1);   // #D4A844
            ps.color2 = new Color4(0.48, 0.25, 0.89, 1);   // #7B3FE4
            ps.colorDead = new Color4(0.48, 0.25, 0.89, 0);

            ps.direction1 = new Vector3(-0.3, 0.5, -0.3);
            ps.direction2 = new Vector3(0.3, 1, 0.3);
            ps.gravity = new Vector3(0, -2, 0);

            ps.start();

            // Lerp emitter toward target over 0.6s
            let elapsed = 0;
            const obs = scene.onBeforeRenderObservable.add(() => {
                  elapsed += scene.getEngine().getDeltaTime() / 1000;
                  const t = Math.min(elapsed / 0.6, 1);
                  const pos = Vector3.Lerp(source, target.position, t);
                  if (ps instanceof GPUParticleSystem) {
                        (ps as GPUParticleSystem).emitter = pos;
                  } else {
                        (ps as ParticleSystem).emitter = pos;
                  }
                  if (t >= 1) {
                        ps.stop();
                        scene.onBeforeRenderObservable.remove(obs);
                        setTimeout(() => ps.dispose(), 600);
                  }
            });
      }
}
