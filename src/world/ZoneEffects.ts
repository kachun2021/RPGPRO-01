import { GPUParticleSystem } from "@babylonjs/core/Particles/gpuParticleSystem";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import { ZONES, type ZoneDefinition } from "./WorldManager";
import { Registry } from "../core/Registry";

// ✅ LAG 修復：靜態 Texture 快取，只建立一次
const PARTICLE_TEX_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJklEQVQYV2P8////fwYiACNIAZZEZEVYFTBiUYRVATYT0RVhNREAx74Hsfh+JcUAAAAASUVORK5CYII=";
let _sharedTexture: Texture | null = null;
function _getParticleTex(scene: Scene): Texture {
      if (!_sharedTexture) {
            _sharedTexture = new Texture(PARTICLE_TEX_URI, scene);
      }
      return _sharedTexture;
}

const ZONE_FX: Record<string, { c1: Color4; c2: Color4; dir1: Vector3; dir2: Vector3; rate: number; label: string }> = {
      forest: { c1: new Color4(0.35, 0.12, 0.55, 0.55), c2: new Color4(0.2, 0.08, 0.35, 0.25), dir1: new Vector3(-0.5, 0.3, -0.5), dir2: new Vector3(0.5, 1.5, 0.5), rate: 12, label: "Purple Mist" },
      swamp: { c1: new Color4(0.08, 0.55, 0.12, 0.45), c2: new Color4(0.04, 0.30, 0.08, 0.18), dir1: new Vector3(-0.3, 0.1, -0.3), dir2: new Vector3(0.3, 0.8, 0.3), rate: 16, label: "Toxic Haze" },
      road: { c1: new Color4(0.55, 0.38, 0.08, 0.38), c2: new Color4(0.40, 0.25, 0.04, 0.15), dir1: new Vector3(-1, 0.1, -0.2), dir2: new Vector3(1, 0.5, 0.2), rate: 8, label: "Dust Storm" },
      highland: { c1: new Color4(0.65, 0.18, 0.04, 0.48), c2: new Color4(0.85, 0.08, 0.0, 0.25), dir1: new Vector3(-0.2, 0.5, -0.2), dir2: new Vector3(0.2, 2, 0.2), rate: 10, label: "Ember Rain" },
      ruins: { c1: new Color4(0.45, 0.60, 0.85, 0.38), c2: new Color4(0.25, 0.40, 0.75, 0.18), dir1: new Vector3(-0.3, -0.5, -0.3), dir2: new Vector3(0.3, 0.3, 0.3), rate: 14, label: "Frost Flakes" },
      fortress: { c1: new Color4(0.75, 0.04, 0.04, 0.58), c2: new Color4(0.55, 0.0, 0.0, 0.18), dir1: new Vector3(-0.5, -1.5, -0.5), dir2: new Vector3(0.5, -0.5, 0.5), rate: 20, label: "Blood Rain" },
};

/**
 * ZoneEffects — per-zone ambient GPU particle system.
 * ✅ LAG 修復：Texture 改為靜態快取，不再每次 zone 切換重建
 */
export class ZoneEffects {
      private _scene: Scene;
      private _currentZoneId = "";
      private _ps: GPUParticleSystem | ParticleSystem | null = null;

      constructor(scene: Scene) { this._scene = scene; }

      update(): void {
            const zone = ZONES.find(z => z.name === Registry.currentZone) ?? ZONES[0];
            if (zone.id === this._currentZoneId) {
                  this._moveToPlayer();
                  return;
            }
            this._currentZoneId = zone.id;
            this._disposeParticles();
            this._createEffect(zone);
      }

      private _createEffect(zone: ZoneDefinition): void {
            const fx = ZONE_FX[zone.id];
            if (!fx) return;

            const cap = 60;
            try {
                  this._ps = new GPUParticleSystem(`zoneFx_${zone.id}`, { capacity: cap }, this._scene);
            } catch {
                  this._ps = new ParticleSystem(`zoneFx_${zone.id}`, cap, this._scene);
            }

            this._ps.particleTexture = _getParticleTex(this._scene); // ✅ 使用快取
            this._ps.minLifeTime = 1.5;
            this._ps.maxLifeTime = 3.2;
            this._ps.minSize = 0.12;
            this._ps.maxSize = 0.38;
            this._ps.emitRate = fx.rate;
            this._ps.color1 = fx.c1;
            this._ps.color2 = fx.c2;
            this._ps.colorDead = new Color4(0, 0, 0, 0);
            this._ps.direction1 = fx.dir1;
            this._ps.direction2 = fx.dir2;
            this._ps.gravity = new Vector3(0, -0.25, 0);
            this._ps.minEmitBox = new Vector3(-8, 2, -8);
            this._ps.maxEmitBox = new Vector3(8, 8, 8);
            this._moveToPlayer();
            this._ps.start();
            console.log(`[ZoneEffects] ${fx.label} activated for ${zone.name}`);
      }

      private _moveToPlayer(): void {
            if (!this._ps || !Registry.player) return;
            this._ps.emitter = Registry.player.position.clone() as unknown as Vector3;
      }

      private _disposeParticles(): void {
            if (this._ps) { this._ps.stop(); this._ps.dispose(); this._ps = null; }
      }

      dispose(): void { this._disposeParticles(); }
}
