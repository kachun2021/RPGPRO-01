import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import type { Scene } from "@babylonjs/core/scene";
import { WorldManager } from "./WorldManager";
import { TerrainGenerator } from "./TerrainGenerator";
import { VegetationSystem } from "./VegetationSystem";
import { Registry } from "../core/Registry";

export const CHUNK_SIZE = 128;
const VIEW_RANGE = 2; // 5×5 grid

export interface ChunkData {
      key: string;
      cx: number;
      cz: number;
      ground: Mesh;
      vegetation: InstancedMesh[]; // ✅ Changed: was Mesh[] (unique mats) → now InstancedMesh[] (shared mats)
}

/**
 * ChunkLoader — 128m chunks, 5×5 active grid around player.
 * ✅ LAG FIX: vegetation now uses InstancedMesh, NO per-chunk material creation.
 * dispose < 16ms budget maintained.
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
            for (let dx = -VIEW_RANGE; dx <= VIEW_RANGE; dx++) {
                  for (let dz = -VIEW_RANGE; dz <= VIEW_RANGE; dz++) {
                        const key = `${cx + dx}_${cz + dz}`;
                        needed.add(key);
                        if (!this._chunks.has(key)) {
                              this._createChunk(cx + dx, cz + dz, key);
                        }
                  }
            }
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
            const zone = WorldManager.getZoneAt(worldX, worldZ);

            // ── Ground ────────────────────────────────────────────────
            const ground = MeshBuilder.CreateGround(
                  `chunk_${key}`,
                  { width: CHUNK_SIZE, height: CHUNK_SIZE, subdivisions: 16 },
                  this._scene
            );
            ground.position.x = worldX;
            ground.position.z = worldZ;
            TerrainGenerator.applyHeight(ground, cx, cz);

            const mat = new StandardMaterial(`chunkMat_${key}`, this._scene);
            const [r, g, b] = zone.colorRGB;
            const noise = (this._hashChunk(cx, cz) % 20 - 10) / 200;
            const dr = Math.min(0.85, Math.max(0.15, r + noise));
            const dg = Math.min(0.85, Math.max(0.15, g + noise));
            const db = Math.min(0.85, Math.max(0.15, b + noise));
            mat.diffuseColor = new Color3(dr, dg, db);
            mat.emissiveColor = new Color3(dr * 0.14, dg * 0.14, db * 0.14);
            mat.specularColor = new Color3(0.04, 0.04, 0.08);
            ground.material = mat;
            ground.receiveShadows = true;
            ground.metadata = { isPlaceholder: true, specId: "terrain_texture" };

            // ── Vegetation (InstancedMesh — no new materials!) ────────
            const vegetation = VegetationSystem.populate(this._scene, ground, cx, cz);
            this._chunks.set(key, { key, cx, cz, ground, vegetation });
      }

      private _disposeChunk(chunk: ChunkData): void {
            // ✅ instances only — shared materials are NOT disposed
            VegetationSystem.disposeChunk(chunk.vegetation);
            chunk.ground.material?.dispose(); // each chunk ground has its own mat (acceptable, only 25 mats)
            chunk.ground.dispose();
      }

      private _hashChunk(cx: number, cz: number): number {
            let h = cx * 374761393 + cz * 668265263;
            h = (h ^ (h >> 13)) * 1274126177;
            return Math.abs(h);
      }

      dispose(): void {
            for (const [, chunk] of this._chunks) this._disposeChunk(chunk);
            this._chunks.clear();
      }
}
