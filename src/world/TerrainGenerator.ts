import type { Mesh } from "@babylonjs/core/Meshes/mesh";

/**
 * TerrainGenerator — Perlin-like noise for chunk height variation.
 * Lightweight pseudo-noise (no external library).
 */
export class TerrainGenerator {
      /**
       * Apply subtle height variation to a ground mesh's vertices.
       */
      static applyHeight(ground: Mesh, cx: number, cz: number): void {
            const positions = ground.getVerticesData("position");
            if (!positions) return;

            for (let i = 0; i < positions.length; i += 3) {
                  const wx = positions[i] + cx * 128;
                  const wz = positions[i + 2] + cz * 128;
                  // Simple multi-octave noise
                  const h = TerrainGenerator._noise(wx * 0.005, wz * 0.005) * 3
                        + TerrainGenerator._noise(wx * 0.02, wz * 0.02) * 0.8;
                  positions[i + 1] = h;
            }

            ground.updateVerticesData("position", positions);
            ground.createNormals(false);
      }

      /** Simple value noise (hash-based, no library needed) */
      private static _noise(x: number, y: number): number {
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            const fx = x - ix;
            const fy = y - iy;

            // Smoothstep
            const sx = fx * fx * (3 - 2 * fx);
            const sy = fy * fy * (3 - 2 * fy);

            const n00 = TerrainGenerator._hash2d(ix, iy);
            const n10 = TerrainGenerator._hash2d(ix + 1, iy);
            const n01 = TerrainGenerator._hash2d(ix, iy + 1);
            const n11 = TerrainGenerator._hash2d(ix + 1, iy + 1);

            const nx0 = n00 + sx * (n10 - n00);
            const nx1 = n01 + sx * (n11 - n01);
            return nx0 + sy * (nx1 - nx0);
      }

      private static _hash2d(x: number, y: number): number {
            let h = x * 374761393 + y * 668265263;
            h = (h ^ (h >> 13)) * 1274126177;
            h = h ^ (h >> 16);
            return (h & 0x7fffffff) / 0x7fffffff; // 0..1
      }
}
