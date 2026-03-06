import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { getSceneGateLabels, getSceneZoneNeighbors } from '../data/runtime/RuntimeWorldRoutes';
import { getRuntimeSceneZoneName, type RuntimeBiomeType, type RuntimeSceneZoneDef } from './RuntimeZoneCatalog';

const BIOME_TEXTURES: Record<RuntimeBiomeType, { diffuse: string; normal: string }> = {
      grass: { diffuse: 'terrain_grass_diffuse.png', normal: 'terrain_grass_normal.png' },
      forest: { diffuse: 'terrain_forest_diffuse.png', normal: 'terrain_forest_normal.png' },
      desert: { diffuse: 'terrain_desert_diffuse.png', normal: 'terrain_desert_normal.png' },
      snow: { diffuse: 'terrain_snow_diffuse.png', normal: 'terrain_snow_normal.png' },
      cave: { diffuse: 'terrain_cave_diffuse.png', normal: 'terrain_cave_normal.png' },
      beach: { diffuse: 'terrain_beach_diffuse.png', normal: 'terrain_beach_normal.png' },
      lava: { diffuse: 'terrain_lava_diffuse.png', normal: 'terrain_lava_normal.png' },
      town: { diffuse: 'terrain_cave_diffuse.png', normal: 'terrain_cave_normal.png' },
};

const BIOME_PBR: Record<RuntimeBiomeType, { roughness: number; metallic: number; emissiveHex?: string }> = {
      grass: { roughness: 0.85, metallic: 0.02 },
      forest: { roughness: 0.88, metallic: 0.03 },
      desert: { roughness: 0.75, metallic: 0.05 },
      snow: { roughness: 0.9, metallic: 0.02 },
      cave: { roughness: 0.95, metallic: 0.15 },
      beach: { roughness: 0.7, metallic: 0.05 },
      lava: { roughness: 0.6, metallic: 0.3, emissiveHex: '#401005' },
      town: { roughness: 0.8, metallic: 0.1 },
};

const BIOME_LIGHT: Record<RuntimeBiomeType, {
      skyBottom: string;
      sunColor: string;
      sunIntensity: number;
      ambientColor: string;
      groundColor: string;
}> = {
      grass: {
            skyBottom: '#A8D8EA',
            sunColor: '#FFF5E0',
            sunIntensity: 1.8,
            ambientColor: '#B4C8E8',
            groundColor: '#4A7A3A',
      },
      forest: {
            skyBottom: '#7AAA7A',
            sunColor: '#C8E8C0',
            sunIntensity: 1.2,
            ambientColor: '#607860',
            groundColor: '#3A5A2A',
      },
      desert: {
            skyBottom: '#D0B880',
            sunColor: '#E0C890',
            sunIntensity: 1.8,
            ambientColor: '#907050',
            groundColor: '#786048',
      },
      snow: {
            skyBottom: '#D0E0F0',
            sunColor: '#D0E0F0',
            sunIntensity: 1.4,
            ambientColor: '#8090A0',
            groundColor: '#C0C8D0',
      },
      cave: {
            skyBottom: '#3A3A5A',
            sunColor: '#8080C0',
            sunIntensity: 0.8,
            ambientColor: '#404060',
            groundColor: '#3A3A5A',
      },
      beach: {
            skyBottom: '#80D0F0',
            sunColor: '#FFF0D0',
            sunIntensity: 2.2,
            ambientColor: '#60A0C0',
            groundColor: '#C0B088',
      },
      lava: {
            skyBottom: '#600808',
            sunColor: '#F04020',
            sunIntensity: 1.0,
            ambientColor: '#601010',
            groundColor: '#3A1010',
      },
      town: {
            skyBottom: '#B0C0D0',
            sunColor: '#FFF0D8',
            sunIntensity: 1.6,
            ambientColor: '#A0A0B0',
            groundColor: '#706860',
      },
};

interface RenderGateDef {
      targetZoneId: string;
      label: string;
      position: { x: number; z: number };
}

/**
 * ZoneRenderer — Builds per-zone terrain, lighting, sky, and teleport gate meshes.
 * Disposable: call dispose() before switching zones.
 */
export class ZoneRenderer {
      private _scene: Scene;
      private _ground: Mesh | null = null;
      private _groundMat: PBRMaterial | null = null;
      private _gateMeshes: Mesh[] = [];
      private _sun: DirectionalLight | null = null;
      private _hemi: HemisphericLight | null = null;
      private _disposed = false;
      private _zoneDef: RuntimeSceneZoneDef;
      private _resolvedGates: RenderGateDef[] = [];

      constructor(scene: Scene, private _shadowGen: ShadowGenerator) {
            this._scene = scene;
            this._zoneDef = null!;
      }

      async build(zoneDef: RuntimeSceneZoneDef): Promise<void> {
            this._zoneDef = zoneDef;
            const light = BIOME_LIGHT[zoneDef.biome] ?? BIOME_LIGHT.grass;

            // --- Sky Gradient ---
            this._scene.clearColor = Color4.FromHexString(light.skyBottom + 'FF');

            // --- Sunlight ---
            this._sun = new DirectionalLight('zone_sun', new Vector3(-0.5, -1, -0.3), this._scene);
            this._sun.intensity = light.sunIntensity;
            this._sun.diffuse = Color3.FromHexString(light.sunColor);
            this._sun.position = new Vector3(30, 50, 30);

            // --- Ambient Light ---
            this._hemi = new HemisphericLight('zone_hemi', Vector3.Up(), this._scene);
            this._hemi.intensity = 0.8;
            this._hemi.diffuse = Color3.FromHexString(light.ambientColor);
            this._hemi.groundColor = Color3.FromHexString(light.groundColor);

            // --- PBR Ground ---
            this._ground = MeshBuilder.CreateGround('zone_ground', {
                  width: 200, height: 200, subdivisions: 16,
            }, this._scene);
            this._ground.receiveShadows = true;

            this._groundMat = new PBRMaterial('zone_groundMat', this._scene);
            const texInfo = BIOME_TEXTURES[zoneDef.biome];
            const pbrInfo = BIOME_PBR[zoneDef.biome];

            const diffTex = new Texture(`assets/textures/${texInfo.diffuse}`, this._scene);
            diffTex.uScale = 10; diffTex.vScale = 10;
            diffTex.wrapU = Texture.WRAP_ADDRESSMODE;
            diffTex.wrapV = Texture.WRAP_ADDRESSMODE;
            this._groundMat.albedoTexture = diffTex;

            const normTex = new Texture(`assets/textures/${texInfo.normal}`, this._scene);
            normTex.uScale = 10; normTex.vScale = 10;
            normTex.wrapU = Texture.WRAP_ADDRESSMODE;
            normTex.wrapV = Texture.WRAP_ADDRESSMODE;
            normTex.level = 0.4;  // soften bump to prevent visible tile-seam grid
            this._groundMat.bumpTexture = normTex;

            // Per-biome PBR parameters
            this._groundMat.roughness = pbrInfo.roughness;
            this._groundMat.metallic = pbrInfo.metallic;
            this._groundMat.directIntensity = 1.5;
            this._groundMat.ambientColor = Color3.FromHexString(light.groundColor);

            // Lava biome emissive glow
            if (pbrInfo.emissiveHex) {
                  this._groundMat.emissiveColor = Color3.FromHexString(pbrInfo.emissiveHex);
                  this._groundMat.emissiveIntensity = 0.4;
            }

            this._ground.material = this._groundMat;

            // --- Teleport Gates ---
            this._buildGates(zoneDef);

            console.log(`[ZoneRenderer] Built zone: ${zoneDef.name} (${zoneDef.biome})`);
      }

      private _buildGates(zoneDef: RuntimeSceneZoneDef): void {
            this._resolvedGates = this._resolveGates(zoneDef);
            for (const gate of this._resolvedGates) {
                  // Gate pillar (glowing cylinder)
                  const pillar = MeshBuilder.CreateCylinder(`gate_${gate.targetZoneId}`, {
                        height: 4, diameter: 1.5, tessellation: 12,
                  }, this._scene);
                  pillar.position = new Vector3(gate.position.x, 2, gate.position.z);

                  const mat = new StandardMaterial(`gateMat_${gate.targetZoneId}`, this._scene);
                  mat.emissiveColor = new Color3(0.9, 0.8, 0.4); // gold glow
                  mat.alpha = 0.6;
                  mat.disableLighting = true;
                  pillar.material = mat;

                  // Gate ring
                  const ring = MeshBuilder.CreateTorus(`gateRing_${gate.targetZoneId}`, {
                        diameter: 2.5, thickness: 0.15, tessellation: 24,
                  }, this._scene);
                  ring.position = new Vector3(gate.position.x, 0.1, gate.position.z);
                  const ringMat = new StandardMaterial(`gateRingMat_${gate.targetZoneId}`, this._scene);
                  ringMat.emissiveColor = new Color3(0.9, 0.75, 0.3);
                  ringMat.alpha = 0.8;
                  ringMat.disableLighting = true;
                  ring.material = ringMat;

                  // Billboard label
                  this._createGateLabel(gate.label, gate.position.x, gate.position.z);

                  this._gateMeshes.push(pillar, ring);
            }
      }

      private _resolveGates(zoneDef: RuntimeSceneZoneDef): RenderGateDef[] {
            const runtimeGates = getSceneGateLabels(zoneDef.id);
            const gates = runtimeGates.length > 0
                  ? runtimeGates
                  : getSceneZoneNeighbors(zoneDef.id).map((targetZoneId) => ({
                        targetZoneId,
                        label: `前往 ${getRuntimeSceneZoneName(targetZoneId)}`,
                  }));

            const radius = 78;
            return gates.map((gate, idx) => {
                  const angle = (idx / gates.length) * Math.PI * 2;
                  return {
                        targetZoneId: gate.targetZoneId,
                        label: gate.label,
                        position: {
                              x: Math.round(Math.cos(angle) * radius),
                              z: Math.round(Math.sin(angle) * radius),
                        },
                  };
            });
      }

      private _createGateLabel(text: string, x: number, z: number): void {
            const div = document.createElement('div');
            div.className = 'gate-label';
            div.textContent = text;
            div.dataset.gateX = x.toString();
            div.dataset.gateZ = z.toString();
            document.getElementById('ui-layer')?.appendChild(div);
      }

      /** Get gate positions for collision detection */
      getGatePositions(): Array<{ targetZoneId: string; position: Vector3; radius: number }> {
            return this._resolvedGates.map(g => ({
                  targetZoneId: g.targetZoneId,
                  position: new Vector3(g.position.x, 0, g.position.z),
                  radius: 2.5,
            }));
      }

      dispose(): void {
            if (this._disposed) return;
            this._disposed = true;

            this._ground?.dispose(false, true);
            this._groundMat?.dispose();
            for (const m of this._gateMeshes) m.dispose(false, true);
            this._sun?.dispose();
            this._hemi?.dispose();

            // Remove gate labels
            document.querySelectorAll('.gate-label').forEach(el => el.remove());

            this._ground = null;
            this._groundMat = null;
            this._gateMeshes = [];
            this._resolvedGates = [];
            this._sun = null;
            this._hemi = null;
      }
}
