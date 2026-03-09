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
import { getRuntimeSceneLayout, type RuntimeSceneLayout } from '../data/runtime/RuntimeSceneLayout';
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
      private _decoMeshes: Mesh[] = [];
      private _decoMaterials: StandardMaterial[] = [];

      constructor(scene: Scene, private _shadowGen: ShadowGenerator) {
            this._scene = scene;
            this._zoneDef = null!;
      }

      async build(zoneDef: RuntimeSceneZoneDef): Promise<void> {
            this._zoneDef = zoneDef;
            const layout = getRuntimeSceneLayout(zoneDef);
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
                  width: layout.size.width, height: layout.size.height, subdivisions: 16,
            }, this._scene);
            this._ground.receiveShadows = true;

            this._groundMat = new PBRMaterial('zone_groundMat', this._scene);
            const texInfo = BIOME_TEXTURES[zoneDef.biome];
            const pbrInfo = BIOME_PBR[zoneDef.biome];
            const textureScale = Math.max(8, Math.round(Math.max(layout.size.width, layout.size.height) / 20));

            const diffTex = new Texture(`assets/textures/${texInfo.diffuse}`, this._scene);
            diffTex.uScale = textureScale; diffTex.vScale = textureScale;
            diffTex.wrapU = Texture.WRAP_ADDRESSMODE;
            diffTex.wrapV = Texture.WRAP_ADDRESSMODE;
            this._groundMat.albedoTexture = diffTex;

            const normTex = new Texture(`assets/textures/${texInfo.normal}`, this._scene);
            normTex.uScale = textureScale; normTex.vScale = textureScale;
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
            this._buildLayoutDecor(zoneDef, layout);

            // --- Teleport Gates ---
            this._buildGates(zoneDef, layout);

            console.log(`[ZoneRenderer] Built zone: ${zoneDef.name} (${zoneDef.biome})`);
      }

      private _buildGates(zoneDef: RuntimeSceneZoneDef, layout: RuntimeSceneLayout): void {
            this._resolvedGates = this._resolveGates(zoneDef, layout);
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

      private _resolveGates(zoneDef: RuntimeSceneZoneDef, layout: RuntimeSceneLayout): RenderGateDef[] {
            const runtimeGates = getSceneGateLabels(zoneDef.id);
            const gates = runtimeGates.length > 0
                  ? runtimeGates
                  : getSceneZoneNeighbors(zoneDef.id).map((targetZoneId) => ({
                        targetZoneId,
                        label: `前往 ${getRuntimeSceneZoneName(targetZoneId)}`,
                  }));

            const anchors = layout.gateAnchors;
            if (anchors.length > 0) {
                  return gates.map((gate, idx) => {
                        const anchor = anchors[idx % anchors.length];
                        return {
                              targetZoneId: gate.targetZoneId,
                              label: gate.label,
                              position: {
                                    x: Math.round(anchor.x),
                                    z: Math.round(anchor.z),
                              },
                        };
                  });
            }

            const radius = Math.min(layout.size.width, layout.size.height) * 0.38;
            return gates.map((gate, idx) => {
                  const angle = (idx / Math.max(1, gates.length)) * Math.PI * 2;
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

      private _buildLayoutDecor(zoneDef: RuntimeSceneZoneDef, layout: RuntimeSceneLayout): void {
            const safeMat = new StandardMaterial(`safeZoneMat_${zoneDef.id}`, this._scene);
            safeMat.diffuseColor = zoneDef.isTown ? Color3.FromHexString('#6BA1D6') : Color3.FromHexString('#8DBE77');
            safeMat.emissiveColor = zoneDef.isTown ? Color3.FromHexString('#2F5272') : Color3.FromHexString('#20441E');
            safeMat.alpha = zoneDef.isTown ? 0.12 : 0.08;
            safeMat.disableLighting = true;
            this._decoMaterials.push(safeMat);

            const safeDisc = MeshBuilder.CreateCylinder(`safeZone_${zoneDef.id}`, {
                  diameter: layout.safeZone.radius * 2,
                  height: 0.05,
                  tessellation: 36,
            }, this._scene);
            safeDisc.position = new Vector3(layout.safeZone.x, 0.03, layout.safeZone.z);
            safeDisc.material = safeMat;
            this._decoMeshes.push(safeDisc);

            const safeSigilMat = new StandardMaterial(`safeSigilMat_${zoneDef.id}`, this._scene);
            safeSigilMat.diffuseColor = zoneDef.isTown ? Color3.FromHexString('#87B9EA') : Color3.FromHexString('#E2C36E');
            safeSigilMat.emissiveColor = zoneDef.isTown ? Color3.FromHexString('#406B9A') : Color3.FromHexString('#6A5524');
            safeSigilMat.alpha = 0.58;
            safeSigilMat.disableLighting = true;
            this._decoMaterials.push(safeSigilMat);

            const safeSigil = MeshBuilder.CreateCylinder(`safeSigil_${zoneDef.id}`, {
                  diameter: Math.max(6, layout.safeZone.radius * 0.38),
                  height: 0.03,
                  tessellation: 24,
            }, this._scene);
            safeSigil.position = new Vector3(layout.safeZone.x, 0.04, layout.safeZone.z);
            safeSigil.material = safeSigilMat;
            this._decoMeshes.push(safeSigil);

            const safeBeaconMat = new StandardMaterial(`safeBeaconMat_${zoneDef.id}`, this._scene);
            safeBeaconMat.diffuseColor = zoneDef.isTown ? Color3.FromHexString('#9ACDFF') : Color3.FromHexString('#F0D389');
            safeBeaconMat.emissiveColor = zoneDef.isTown ? Color3.FromHexString('#5A8CC2') : Color3.FromHexString('#7B6028');
            this._decoMaterials.push(safeBeaconMat);
            this._buildSafeZoneBoundary(zoneDef, layout, safeBeaconMat);

            const roadEdgeMat = new StandardMaterial(`roadEdgeMat_${zoneDef.id}`, this._scene);
            roadEdgeMat.diffuseColor = zoneDef.isTown ? Color3.FromHexString('#B89C7A') : Color3.FromHexString('#C7AE7A');
            roadEdgeMat.emissiveColor = zoneDef.id === 'starter_meadow'
                  ? Color3.FromHexString('#4E3F18')
                  : zoneDef.id === 'misty_forest'
                        ? Color3.FromHexString('#223B2A')
                        : Color3.FromHexString('#30281D');
            this._decoMaterials.push(roadEdgeMat);

            const roadGuideMat = new StandardMaterial(`roadGuideMat_${zoneDef.id}`, this._scene);
            roadGuideMat.diffuseColor = zoneDef.isTown ? Color3.FromHexString('#D8E8FF') : Color3.FromHexString('#E9D7AA');
            roadGuideMat.emissiveColor = zoneDef.isTown ? Color3.FromHexString('#6D8FB5') : Color3.FromHexString('#70541E');
            roadGuideMat.disableLighting = true;
            this._decoMaterials.push(roadGuideMat);

            for (const road of layout.roads) {
                  const roadMesh = MeshBuilder.CreateBox(`road_${zoneDef.id}_${this._decoMeshes.length}`, {
                        width: road.width,
                        depth: road.depth,
                        height: 0.06,
                  }, this._scene);
                  roadMesh.position = new Vector3(road.x, 0.02, road.z);
                  roadMesh.rotation.y = (road.rotationDeg ?? 0) * Math.PI / 180;
                  const roadMat = new StandardMaterial(`roadMat_${zoneDef.id}_${this._decoMaterials.length}`, this._scene);
                  roadMat.diffuseColor = zoneDef.isTown ? Color3.FromHexString('#716454') : Color3.FromHexString('#786853');
                  roadMat.alpha = 0.95;
                  this._decoMaterials.push(roadMat);
                  roadMesh.material = roadMat;
                  this._decoMeshes.push(roadMesh);
                  this._buildRoadAccents(zoneDef, layout, road, roadEdgeMat, roadGuideMat);
            }

            for (const obstacle of layout.obstacles) {
                  const obstacleMesh = MeshBuilder.CreateBox(`obstacle_${zoneDef.id}_${this._decoMeshes.length}`, {
                        width: obstacle.width,
                        depth: obstacle.depth,
                        height: obstacle.height,
                  }, this._scene);
                  obstacleMesh.position = new Vector3(obstacle.x, obstacle.height * 0.5, obstacle.z);
                  const obstacleMat = new StandardMaterial(`obstacleMat_${zoneDef.id}_${this._decoMaterials.length}`, this._scene);
                  obstacleMat.diffuseColor = zoneDef.biome === 'forest'
                        ? Color3.FromHexString('#3B5A2C')
                        : zoneDef.biome === 'desert'
                              ? Color3.FromHexString('#8A6B4C')
                              : Color3.FromHexString('#5C5A62');
                  this._decoMaterials.push(obstacleMat);
                  obstacleMesh.material = obstacleMat;
                  this._decoMeshes.push(obstacleMesh);
            }

            for (const landmark of layout.landmarks) {
                  const scale = Math.max(0.8, landmark.scale ?? 1);
                  let landmarkMesh: Mesh;
                  switch (landmark.kind) {
                        case 'tree':
                              landmarkMesh = MeshBuilder.CreateCylinder(`landmark_tree_${zoneDef.id}_${this._decoMeshes.length}`, {
                                    height: 6 * scale,
                                    diameterTop: 0.7 * scale,
                                    diameterBottom: 2.2 * scale,
                                    tessellation: 8,
                              }, this._scene);
                              break;
                        case 'crystal':
                              landmarkMesh = MeshBuilder.CreateCylinder(`landmark_crystal_${zoneDef.id}_${this._decoMeshes.length}`, {
                                    height: 5 * scale,
                                    diameterTop: 0.2 * scale,
                                    diameterBottom: 2 * scale,
                                    tessellation: 6,
                              }, this._scene);
                              break;
                        case 'monolith':
                              landmarkMesh = MeshBuilder.CreateBox(`landmark_monolith_${zoneDef.id}_${this._decoMeshes.length}`, {
                                    width: 2.4 * scale,
                                    depth: 2.4 * scale,
                                    height: 8 * scale,
                              }, this._scene);
                              break;
                        case 'pillar':
                        default:
                              landmarkMesh = MeshBuilder.CreateCylinder(`landmark_pillar_${zoneDef.id}_${this._decoMeshes.length}`, {
                                    height: 7 * scale,
                                    diameter: 1.4 * scale,
                                    tessellation: 12,
                              }, this._scene);
                              break;
                  }
                  landmarkMesh.position = new Vector3(landmark.x, landmarkMesh.getBoundingInfo().boundingBox.extendSize.y, landmark.z);
                  const landmarkMat = new StandardMaterial(`landmarkMat_${zoneDef.id}_${this._decoMaterials.length}`, this._scene);
                  landmarkMat.diffuseColor = landmark.kind === 'tree'
                        ? Color3.FromHexString('#4F7B3A')
                        : landmark.kind === 'crystal'
                              ? Color3.FromHexString('#7BD6FF')
                              : Color3.FromHexString('#B79A64');
                  if (landmark.kind === 'crystal') {
                        landmarkMat.emissiveColor = Color3.FromHexString('#4AA2C8');
                  }
                  this._decoMaterials.push(landmarkMat);
                  landmarkMesh.material = landmarkMat;
                  this._decoMeshes.push(landmarkMesh);
            }
      }

      private _buildSafeZoneBoundary(zoneDef: RuntimeSceneZoneDef, layout: RuntimeSceneLayout, beaconMat: StandardMaterial): void {
            const beaconCount = zoneDef.id === 'starter_meadow' ? 8 : zoneDef.id === 'misty_forest' ? 6 : 4;
            const baseRadius = Math.max(6, layout.safeZone.radius - 1.5);
            for (let idx = 0; idx < beaconCount; idx += 1) {
                  const angle = (idx / beaconCount) * Math.PI * 2;
                  const x = layout.safeZone.x + Math.cos(angle) * baseRadius;
                  const z = layout.safeZone.z + Math.sin(angle) * baseRadius;

                  const post = MeshBuilder.CreateCylinder(`safeBeacon_${zoneDef.id}_${idx}`, {
                        diameter: 0.8,
                        height: 1.2,
                        tessellation: 10,
                  }, this._scene);
                  post.position = new Vector3(x, 0.62, z);
                  post.material = beaconMat;
                  this._decoMeshes.push(post);

                  const cap = MeshBuilder.CreateSphere(`safeBeaconCap_${zoneDef.id}_${idx}`, {
                        diameter: 0.56,
                        segments: 8,
                  }, this._scene);
                  cap.position = new Vector3(x, 1.36, z);
                  cap.material = beaconMat;
                  this._decoMeshes.push(cap);
            }
      }

      private _buildRoadAccents(
            zoneDef: RuntimeSceneZoneDef,
            layout: RuntimeSceneLayout,
            road: RuntimeSceneLayout['roads'][number],
            edgeMat: StandardMaterial,
            guideMat: StandardMaterial,
      ): void {
            const rotation = ((road.rotationDeg ?? 0) * Math.PI) / 180;
            const edgeOffset = Math.max(road.width * 0.5 - 0.42, 0.42);

            for (const direction of [-1, 1]) {
                  const edgePos = this._roadLocalToWorld(road, direction * edgeOffset, 0);
                  const edgeStrip = MeshBuilder.CreateBox(`roadEdge_${zoneDef.id}_${this._decoMeshes.length}`, {
                        width: 0.68,
                        depth: road.depth + 0.8,
                        height: 0.08,
                  }, this._scene);
                  edgeStrip.position = new Vector3(edgePos.x, 0.04, edgePos.z);
                  edgeStrip.rotation.y = rotation;
                  edgeStrip.material = edgeMat;
                  this._decoMeshes.push(edgeStrip);
            }

            if (road.depth > road.width * 1.4) {
                  const dashCount = Math.max(2, Math.floor(road.depth / 18));
                  const dashDepth = Math.min(4.8, Math.max(2.8, road.depth / 10));
                  const laneWidth = Math.max(0.7, Math.min(1.1, road.width * 0.08));
                  const span = road.depth - dashDepth - 10;
                  for (let idx = 0; idx < dashCount; idx += 1) {
                        const t = dashCount === 1 ? 0.5 : idx / (dashCount - 1);
                        const localZ = (-road.depth * 0.5) + 5 + (span * t);
                        const dashPos = this._roadLocalToWorld(road, 0, localZ);
                        const dash = MeshBuilder.CreateBox(`roadDash_${zoneDef.id}_${this._decoMeshes.length}`, {
                              width: laneWidth,
                              depth: dashDepth,
                              height: 0.09,
                        }, this._scene);
                        dash.position = new Vector3(dashPos.x, 0.05, dashPos.z);
                        dash.rotation.y = rotation;
                        dash.material = guideMat;
                        this._decoMeshes.push(dash);
                  }
            }

            if (!this._isEarlyGuideZone(zoneDef.id) || road.depth <= road.width * 1.4) {
                  return;
            }

            const postOffset = road.width * 0.5 + 1.5;
            const postCount = Math.max(2, Math.min(5, Math.floor(road.depth / 22)));
            for (let idx = 0; idx < postCount; idx += 1) {
                  const t = postCount === 1 ? 0.5 : idx / (postCount - 1);
                  const localZ = (-road.depth * 0.5) + 8 + ((road.depth - 16) * t);
                  if (Math.abs(localZ) < 5) continue;
                  for (const direction of [-1, 1]) {
                        const postPos = this._roadLocalToWorld(road, direction * postOffset, localZ);
                        const post = MeshBuilder.CreateCylinder(`roadGuidePost_${zoneDef.id}_${this._decoMeshes.length}`, {
                              diameter: 0.5,
                              height: 1.45,
                              tessellation: 10,
                        }, this._scene);
                        post.position = new Vector3(postPos.x, 0.74, postPos.z);
                        post.material = edgeMat;
                        this._decoMeshes.push(post);

                        const cap = MeshBuilder.CreateSphere(`roadGuideCap_${zoneDef.id}_${this._decoMeshes.length}`, {
                              diameter: 0.48,
                              segments: 8,
                        }, this._scene);
                        cap.position = new Vector3(postPos.x, 1.55, postPos.z);
                        cap.material = guideMat;
                        this._decoMeshes.push(cap);
                  }
            }

            if (zoneDef.id !== 'starter_meadow' || Math.abs(rotation) > 0.001) return;
            const frontierZ = layout.safeZone.z + layout.safeZone.radius + 8;
            const localFrontierZ = frontierZ - road.z;
            const halfDepth = road.depth * 0.5;
            if (localFrontierZ <= (-halfDepth + 4) || localFrontierZ >= (halfDepth - 4)) return;

            const archSideOffset = road.width * 0.5 + 2.1;
            for (const direction of [-1, 1]) {
                  const sidePos = this._roadLocalToWorld(road, direction * archSideOffset, localFrontierZ);
                  const archPost = MeshBuilder.CreateCylinder(`frontierPost_${zoneDef.id}_${this._decoMeshes.length}`, {
                        diameter: 0.9,
                        height: 5.2,
                        tessellation: 12,
                  }, this._scene);
                  archPost.position = new Vector3(sidePos.x, 2.64, sidePos.z);
                  archPost.material = edgeMat;
                  this._decoMeshes.push(archPost);
            }

            const lintelPos = this._roadLocalToWorld(road, 0, localFrontierZ);
            const lintel = MeshBuilder.CreateBox(`frontierLintel_${zoneDef.id}_${this._decoMeshes.length}`, {
                  width: road.width + 4.6,
                  depth: 0.9,
                  height: 0.72,
            }, this._scene);
            lintel.position = new Vector3(lintelPos.x, 5.18, lintelPos.z);
            lintel.rotation.y = rotation;
            lintel.material = guideMat;
            this._decoMeshes.push(lintel);
      }

      private _isEarlyGuideZone(zoneId: string): boolean {
            return zoneId === 'starter_meadow' || zoneId === 'misty_forest';
      }

      private _roadLocalToWorld(
            road: RuntimeSceneLayout['roads'][number],
            localX: number,
            localZ: number,
      ): { x: number; z: number } {
            const rotation = ((road.rotationDeg ?? 0) * Math.PI) / 180;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            return {
                  x: road.x + (localX * cos) - (localZ * sin),
                  z: road.z + (localX * sin) + (localZ * cos),
            };
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
            for (const mesh of this._decoMeshes) mesh.dispose(false, true);
            for (const mat of this._decoMaterials) mat.dispose();
            this._sun?.dispose();
            this._hemi?.dispose();

            // Remove gate labels
            document.querySelectorAll('.gate-label').forEach(el => el.remove());

            this._ground = null;
            this._groundMat = null;
            this._gateMeshes = [];
            this._decoMeshes = [];
            this._decoMaterials = [];
            this._resolvedGates = [];
            this._sun = null;
            this._hemi = null;
      }
}
