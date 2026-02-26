import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldManager } from "./WorldManager";
import { TerrainGenerator } from "./TerrainGenerator";
import { VegetationSystem } from "./VegetationSystem";
import { Registry } from "../core/Registry";

const CHUNK_SIZE = 128;
const VIEW_RANGE = 2; // 5×5 grid — 640m visible range for better immersion

export interface ChunkData {
      key: string;
      cx: number;
      cz: number;
      ground: Mesh;
      vegetation: Mesh[];
}

/**
 * ChunkLoader — 128m chunks, 3×3 active grid around player.
 * Older chunks are disposed when player moves away.
 * Dispose must complete < 16ms to stay within 60fps budget.
 */
export class ChunkLoader {
      private _scene: Scene;
      private _chunks = new Map<string, ChunkData>();
      private _lastCX = -9999;
      private _lastCZ = -9999;

      constructor(scene: Scene) {
            this._scene = scene;
            Registry.chunkLoader = this;
      }

      /** Call every frame — checks if player moved to a new chunk */
      update(): void {
            const player = Registry.player;
            if (!player) return;

            const pos = player.position;
            const cx = Math.floor(pos.x / CHUNK_SIZE);
            const cz = Math.floor(pos.z / CHUNK_SIZE);

            if (cx === this._lastCX && cz === this._lastCZ) return;
            this._lastCX = cx;
            this._lastCZ = cz;
            this._rebuildGrid(cx, cz);
      }

      private _rebuildGrid(cx: number, cz: number): void {
            const needed = new Set<string>();

            // Generate needed chunk keys
            for (let dx = -VIEW_RANGE; dx <= VIEW_RANGE; dx++) {
                  for (let dz = -VIEW_RANGE; dz <= VIEW_RANGE; dz++) {
                        const key = `${cx + dx}_${cz + dz}`;
                        needed.add(key);
                        if (!this._chunks.has(key)) {
                              this._createChunk(cx + dx, cz + dz, key);
                        }
                  }
            }

            // Dispose chunks outside view
            for (const [key, chunk] of this._chunks) {
                  if (!needed.has(key)) {
                        this._disposeChunk(chunk);
                        this._chunks.delete(key);
                  }
            }
      }

      private _createChunk(cx: number, cz: number, key: string): void {
            const worldX = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
            const worldZ = cz * CHUNK_SIZE + CHUNK_SIZE / 2;

            // Get zone color for this position
            const zone = WorldManager.getZoneAt(worldX, worldZ);

            // Ground mesh — 16 subdivisions for visible terrain relief
            const ground = MeshBuilder.CreateGround(
                  `chunk_${key}`,
                  { width: CHUNK_SIZE, height: CHUNK_SIZE, subdivisions: 16 },
                  this._scene
            );
            ground.position.x = worldX;
            ground.position.z = worldZ;

            // Apply terrain height via TerrainGenerator
            TerrainGenerator.applyHeight(ground, cx, cz);

            // Zone-colored material — brighter diffuse + subtle emissive = visible colors
            const mat = new StandardMaterial(`chunkMat_${key}`, this._scene);
            const [r, g, b] = zone.colorRGB;
            // Add slight noise variation per chunk
            const noise = (this._hashChunk(cx, cz) % 20 - 10) / 200;
            const dr = Math.min(0.85, Math.max(0.15, r + noise));
            const dg = Math.min(0.85, Math.max(0.15, g + noise));
            const db = Math.min(0.85, Math.max(0.15, b + noise));
            mat.diffuseColor = new Color3(dr, dg, db);
            // Add subtle emissive so zone color is always visible even in low light
            mat.emissiveColor = new Color3(dr * 0.15, dg * 0.15, db * 0.15);
            mat.specularColor = new Color3(0.05, 0.05, 0.1); // tiny specular for wet-ground feel
            ground.material = mat;
            ground.receiveShadows = true;
            ground.metadata = { isPlaceholder: true, specId: "terrain_texture" };

            // Vegetation
            const vegetation = VegetationSystem.populate(this._scene, ground, cx, cz);

            this._chunks.set(key, { key, cx, cz, ground, vegetation });
      }

      private _disposeChunk(chunk: ChunkData): void {
            // Dispose vegetation first
            for (const v of chunk.vegetation) {
                  v.material?.dispose();
                  v.dispose();
            }
            // Dispose ground
            chunk.ground.material?.dispose();
            chunk.ground.dispose();
      }

      private _hashChunk(cx: number, cz: number): number {
            let h = cx * 374761393 + cz * 668265263;
            h = (h ^ (h >> 13)) * 1274126177;
            return Math.abs(h);
      }

      dispose(): void {
            for (const [, chunk] of this._chunks) {
                  this._disposeChunk(chunk);
            }
            this._chunks.clear();
      }
}
