import { GPUParticleSystem } from "@babylonjs/core/Particles/gpuParticleSystem";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import { ZONES, type ZoneDefinition } from "./WorldManager";
import { Registry } from "../core/Registry";

// Particle data URI (tiny white circle)
const PARTICLE_TEX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJklEQVQYV2P8////fwYiACNIAZZEZEVYFTBiUYRVATYT0RVhNREAx74Hsfh+JcUAAAAASUVORK5CYII=";

// Zone-specific particle configs
const ZONE_FX: Record<string, { c1: Color4; c2: Color4; dir1: Vector3; dir2: Vector3; rate: number; label: string }> = {
      forest: {
            c1: new Color4(0.3, 0.15, 0.5, 0.6), c2: new Color4(0.2, 0.1, 0.35, 0.3),
            dir1: new Vector3(-0.5, 0.3, -0.5), dir2: new Vector3(0.5, 1.5, 0.5),
            rate: 15, label: "Purple Mist"
      },
      swamp: {
            c1: new Color4(0.1, 0.5, 0.15, 0.5), c2: new Color4(0.05, 0.3, 0.1, 0.2),
            dir1: new Vector3(-0.3, 0.1, -0.3), dir2: new Vector3(0.3, 0.8, 0.3),
            rate: 20, label: "Toxic Haze"
      },
      road: {
            c1: new Color4(0.5, 0.35, 0.1, 0.4), c2: new Color4(0.4, 0.25, 0.05, 0.2),
            dir1: new Vector3(-1, 0.1, -0.2), dir2: new Vector3(1, 0.5, 0.2),
            rate: 10, label: "Dust Storm"
      },
      highland: {
            c1: new Color4(0.6, 0.2, 0.05, 0.5), c2: new Color4(0.8, 0.1, 0.0, 0.3),
            dir1: new Vector3(-0.2, 0.5, -0.2), dir2: new Vector3(0.2, 2, 0.2),
            rate: 12, label: "Ember Rain"
      },
      ruins: {
            c1: new Color4(0.5, 0.6, 0.8, 0.4), c2: new Color4(0.3, 0.4, 0.7, 0.2),
            dir1: new Vector3(-0.3, -0.5, -0.3), dir2: new Vector3(0.3, 0.3, 0.3),
            rate: 18, label: "Frost Flakes"
      },
      fortress: {
            c1: new Color4(0.7, 0.05, 0.05, 0.6), c2: new Color4(0.5, 0.0, 0.0, 0.2),
            dir1: new Vector3(-0.5, -1.5, -0.5), dir2: new Vector3(0.5, -0.5, 0.5),
            rate: 25, label: "Blood Rain"
      },
};

/**
 * ZoneEffects — per-zone ambient GPU particle system.
 * Follows player, switches effect on zone change.
 */
export class ZoneEffects {
      private _scene: Scene;
      private _currentZoneId = "";
      private _ps: GPUParticleSystem | ParticleSystem | null = null;

      constructor(scene: Scene) {
            this._scene = scene;
      }

      update(): void {
            const zone = ZONES.find(z => z.name === Registry.currentZone) ?? ZONES[0];
            if (zone.id === this._currentZoneId) {
                  // Just move emitter to player
                  this._moveToPlayer();
                  return;
            }

            // Zone changed — switch particle effect
            this._currentZoneId = zone.id;
            this._disposeParticles();
            this._createEffect(zone);
      }

      private _createEffect(zone: ZoneDefinition): void {
            const fx = ZONE_FX[zone.id];
            if (!fx) return;

            const cap = 80;
            try {
                  this._ps = new GPUParticleSystem(`zoneFx_${zone.id}`, { capacity: cap }, this._scene);
            } catch {
                  this._ps = new ParticleSystem(`zoneFx_${zone.id}`, cap, this._scene);
            }

            this._ps.particleTexture = new Texture(PARTICLE_TEX, this._scene);
            this._ps.minLifeTime = 1.5;
            this._ps.maxLifeTime = 3.0;
            this._ps.minSize = 0.15;
            this._ps.maxSize = 0.4;
            this._ps.emitRate = fx.rate;
            this._ps.color1 = fx.c1;
            this._ps.color2 = fx.c2;
            this._ps.colorDead = new Color4(0, 0, 0, 0);
            this._ps.direction1 = fx.dir1;
            this._ps.direction2 = fx.dir2;
            this._ps.gravity = new Vector3(0, -0.3, 0);
            this._ps.minEmitBox = new Vector3(-8, 3, -8);
            this._ps.maxEmitBox = new Vector3(8, 8, 8);

            this._moveToPlayer();
            this._ps.start();
            console.log(`[ZoneEffects] ${fx.label} activated for ${zone.name}`);
      }

      private _moveToPlayer(): void {
            if (!this._ps || !Registry.player) return;
            const pos = Registry.player.position;
            this._ps.emitter = pos.clone() as unknown as Vector3;
      }

      private _disposeParticles(): void {
            if (this._ps) {
                  this._ps.stop();
                  this._ps.dispose();
                  this._ps = null;
            }
      }

      dispose(): void {
            this._disposeParticles();
      }
}
