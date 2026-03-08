import layoutsRaw from './world.scene.layouts.json';
import type { RuntimeBiomeType, RuntimeSceneZoneDef } from '../../world/RuntimeZoneCatalog';

export interface ScenePocket {
      x: number;
      z: number;
      radius: number;
}

export interface SceneRoad {
      x: number;
      z: number;
      width: number;
      depth: number;
      rotationDeg?: number;
}

export interface SceneObstacle {
      x: number;
      z: number;
      width: number;
      depth: number;
      height: number;
}

export interface SceneLandmark {
      kind: 'pillar' | 'tree' | 'crystal' | 'monolith';
      x: number;
      z: number;
      scale?: number;
}

export interface RuntimeSceneLayout {
      size: { width: number; height: number };
      safeZone: ScenePocket;
      starterPockets: ScenePocket[];
      fieldPockets: ScenePocket[];
      elitePockets: ScenePocket[];
      bossPocket: ScenePocket;
      gateAnchors: Array<{ x: number; z: number }>;
      roads: SceneRoad[];
      obstacles: SceneObstacle[];
      landmarks: SceneLandmark[];
}

interface SceneLayoutPayload {
      zones?: Record<string, Partial<RuntimeSceneLayout>>;
}

const DATA = (layoutsRaw as SceneLayoutPayload) ?? {};

function clonePocket(pocket: ScenePocket): ScenePocket {
      return { ...pocket };
}

function cloneLayout(layout: RuntimeSceneLayout): RuntimeSceneLayout {
      return {
            size: { ...layout.size },
            safeZone: { ...layout.safeZone },
            starterPockets: layout.starterPockets.map(clonePocket),
            fieldPockets: layout.fieldPockets.map(clonePocket),
            elitePockets: layout.elitePockets.map(clonePocket),
            bossPocket: { ...layout.bossPocket },
            gateAnchors: layout.gateAnchors.map((anchor) => ({ ...anchor })),
            roads: layout.roads.map((road) => ({ ...road })),
            obstacles: layout.obstacles.map((obstacle) => ({ ...obstacle })),
            landmarks: layout.landmarks.map((landmark) => ({ ...landmark })),
      };
}

function biomeDefaultSize(biome: RuntimeBiomeType, isTown: boolean): { width: number; height: number } {
      if (isTown) return { width: 210, height: 180 };
      switch (biome) {
            case 'forest': return { width: 240, height: 220 };
            case 'desert': return { width: 250, height: 220 };
            case 'snow': return { width: 240, height: 220 };
            case 'cave': return { width: 220, height: 220 };
            case 'beach': return { width: 250, height: 210 };
            case 'lava': return { width: 230, height: 210 };
            case 'town': return { width: 210, height: 180 };
            case 'grass':
            default:
                  return { width: 230, height: 200 };
      }
}

function buildFallbackLayout(zoneDef: RuntimeSceneZoneDef): RuntimeSceneLayout {
      const size = biomeDefaultSize(zoneDef.biome, zoneDef.isTown);
      const halfW = Math.round(size.width * 0.28);
      const near = Math.round(size.height * 0.08);
      const mid = Math.round(size.height * 0.22);
      const far = Math.round(size.height * 0.38);
      const boss = Math.round(size.height * 0.46);

      return {
            size,
            safeZone: {
                  x: zoneDef.spawnPoint.x,
                  z: zoneDef.spawnPoint.z - 8,
                  radius: zoneDef.isTown ? 30 : 16,
            },
            starterPockets: [
                  { x: -18, z: near, radius: 12 },
                  { x: 18, z: near + 8, radius: 12 },
            ],
            fieldPockets: [
                  { x: -halfW, z: mid, radius: 18 },
                  { x: 0, z: mid + 10, radius: 20 },
                  { x: halfW, z: mid, radius: 18 },
            ],
            elitePockets: [
                  { x: -halfW - 12, z: far, radius: 16 },
                  { x: halfW + 12, z: far, radius: 16 },
            ],
            bossPocket: { x: 0, z: boss, radius: 18 },
            gateAnchors: [
                  { x: -Math.round(size.width * 0.35), z: -Math.round(size.height * 0.35) },
                  { x: Math.round(size.width * 0.35), z: -Math.round(size.height * 0.35) },
                  { x: 0, z: Math.round(size.height * 0.42) },
            ],
            roads: zoneDef.isTown
                  ? [{ x: 0, z: 0, width: 92, depth: 18, rotationDeg: 0 }]
                  : [{ x: 0, z: 4, width: 18, depth: size.height * 0.52, rotationDeg: 0 }],
            obstacles: zoneDef.isTown
                  ? []
                  : [
                        { x: -22, z: mid, width: 12, depth: 12, height: 6 },
                        { x: 24, z: far - 6, width: 14, depth: 12, height: 7 },
                  ],
            landmarks: zoneDef.isTown
                  ? [{ kind: 'pillar', x: 0, z: -10, scale: 1.1 }]
                  : [{ kind: zoneDef.biome === 'forest' ? 'tree' : 'monolith', x: 0, z: far + 10, scale: 1.2 }],
      };
}

export function getRuntimeSceneLayout(zoneDef: RuntimeSceneZoneDef): RuntimeSceneLayout {
      const fallback = buildFallbackLayout(zoneDef);
      const zoneOverride = DATA.zones?.[zoneDef.id] ?? {};

      return {
            size: { ...fallback.size, ...(zoneOverride.size ?? {}) },
            safeZone: { ...fallback.safeZone, ...(zoneOverride.safeZone ?? {}) },
            starterPockets: Array.isArray(zoneOverride.starterPockets) && zoneOverride.starterPockets.length > 0
                  ? zoneOverride.starterPockets.map((pocket) => ({ ...fallback.starterPockets[0], ...pocket }))
                  : fallback.starterPockets.map(clonePocket),
            fieldPockets: Array.isArray(zoneOverride.fieldPockets) && zoneOverride.fieldPockets.length > 0
                  ? zoneOverride.fieldPockets.map((pocket) => ({ ...fallback.fieldPockets[0], ...pocket }))
                  : fallback.fieldPockets.map(clonePocket),
            elitePockets: Array.isArray(zoneOverride.elitePockets) && zoneOverride.elitePockets.length > 0
                  ? zoneOverride.elitePockets.map((pocket) => ({ ...fallback.elitePockets[0], ...pocket }))
                  : fallback.elitePockets.map(clonePocket),
            bossPocket: { ...fallback.bossPocket, ...(zoneOverride.bossPocket ?? {}) },
            gateAnchors: Array.isArray(zoneOverride.gateAnchors) && zoneOverride.gateAnchors.length > 0
                  ? zoneOverride.gateAnchors.map((anchor) => ({ ...anchor }))
                  : fallback.gateAnchors.map((anchor) => ({ ...anchor })),
            roads: Array.isArray(zoneOverride.roads) ? zoneOverride.roads.map((road) => ({ ...road })) : fallback.roads.map((road) => ({ ...road })),
            obstacles: Array.isArray(zoneOverride.obstacles) ? zoneOverride.obstacles.map((obstacle) => ({ ...obstacle })) : fallback.obstacles.map((obstacle) => ({ ...obstacle })),
            landmarks: Array.isArray(zoneOverride.landmarks) ? zoneOverride.landmarks.map((landmark) => ({ ...landmark })) : fallback.landmarks.map((landmark) => ({ ...landmark })),
      };
}

export function cloneRuntimeSceneLayout(zoneDef: RuntimeSceneZoneDef): RuntimeSceneLayout {
      return cloneLayout(getRuntimeSceneLayout(zoneDef));
}
