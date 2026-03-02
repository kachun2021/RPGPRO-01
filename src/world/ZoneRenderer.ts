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
import { BIOME_TEXTURES, type ZoneDef } from './ZoneDefinitions';

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
      private _zoneDef: ZoneDef;

      constructor(scene: Scene, private _shadowGen: ShadowGenerator) {
            this._scene = scene;
            this._zoneDef = null!;
      }

      async build(zoneDef: ZoneDef): Promise<void> {
            this._zoneDef = zoneDef;

            // --- Sky Gradient ---
            this._scene.clearColor = Color4.FromHexString(zoneDef.skyBottom + 'FF');

            // --- Sunlight ---
            this._sun = new DirectionalLight('zone_sun', new Vector3(-0.5, -1, -0.3), this._scene);
            this._sun.intensity = zoneDef.sunIntensity;
            this._sun.diffuse = Color3.FromHexString(zoneDef.sunColor);
            this._sun.position = new Vector3(30, 50, 30);

            // --- Ambient Light ---
            this._hemi = new HemisphericLight('zone_hemi', Vector3.Up(), this._scene);
            this._hemi.intensity = 0.8;
            this._hemi.diffuse = Color3.FromHexString(zoneDef.ambientColor);
            this._hemi.groundColor = Color3.FromHexString(zoneDef.groundColor);

            // --- PBR Ground ---
            this._ground = MeshBuilder.CreateGround('zone_ground', {
                  width: 200, height: 200, subdivisions: 32,
            }, this._scene);
            this._ground.receiveShadows = true;

            this._groundMat = new PBRMaterial('zone_groundMat', this._scene);
            const texInfo = BIOME_TEXTURES[zoneDef.biome];

            const diffTex = new Texture(`assets/textures/${texInfo.diffuse}`, this._scene);
            diffTex.uScale = 16; diffTex.vScale = 16;
            this._groundMat.albedoTexture = diffTex;

            const normTex = new Texture(`assets/textures/${texInfo.normal}`, this._scene);
            normTex.uScale = 16; normTex.vScale = 16;
            this._groundMat.bumpTexture = normTex;

            this._groundMat.roughness = 0.85;
            this._groundMat.metallic = 0.02;
            this._groundMat.directIntensity = 1.5;
            this._groundMat.ambientColor = Color3.FromHexString(zoneDef.groundColor);
            this._ground.material = this._groundMat;

            // --- Teleport Gates ---
            this._buildGates(zoneDef);

            console.log(`[ZoneRenderer] Built zone: ${zoneDef.name} (${zoneDef.biome})`);
      }

      private _buildGates(zoneDef: ZoneDef): void {
            for (const gate of zoneDef.gates) {
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
            return this._zoneDef.gates.map(g => ({
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
            this._sun = null;
            this._hemi = null;
      }
}
