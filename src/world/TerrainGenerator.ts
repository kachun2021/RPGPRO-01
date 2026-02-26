import type { Mesh } from "@babylonjs/core/Meshes/mesh";

/**
 * TerrainGenerator — Perlin-like noise for chunk height variation.
 * ✅ 修復：applyHeight 用絕對世界座標（避免偏移 bug）
 * ✅ 新增：getHeightAt(wx, wz) 供 VegetationSystem 使用
 * ✅ 改善：地形起伏幅度提升，視覺更豐富
 */
export class TerrainGenerator {
      // ── 地形參數（調整這裡可全局改變地形風格）──────────────────
      private static readonly LARGE_SCALE = 0.004;  // 大丘陵頻率
      private static readonly LARGE_AMP = 4.5;    // 大丘陵高度（m）
      private static readonly MEDIUM_SCALE = 0.018;  // 中等起伏
      private static readonly MEDIUM_AMP = 1.2;    // 中等高度
      private static readonly SMALL_SCALE = 0.07;   // 細節噪聲
      private static readonly SMALL_AMP = 0.3;    // 細節高度

      /**
       * Apply height to a ground mesh's vertices using world coordinates.
       * ✅ 修復：直接使用 vertex 的世界座標，不再加 cx*128 偏移
       */
      static applyHeight(ground: Mesh, cx: number, cz: number): void {
            const positions = ground.getVerticesData("position");
            if (!positions) return;

            const chunkSize = 128;
            const originX = cx * chunkSize;
            const originZ = cz * chunkSize;

            for (let i = 0; i < positions.length; i += 3) {
                  // Vertex local position → world position
                  const wx = originX + positions[i];
                  const wz = originZ + positions[i + 2];
                  positions[i + 1] = TerrainGenerator.getHeightAt(wx, wz);
            }

            ground.updateVerticesData("position", positions);
            ground.createNormals(false);
      }

      /**
       * ✅ 新增公開方法：查詢任意世界坐標的地形高度
       * VegetationSystem、PhantomPresence 等都可使用
       */
      static getHeightAt(wx: number, wz: number): number {
            return (
                  TerrainGenerator._noise(wx * TerrainGenerator.LARGE_SCALE, wz * TerrainGenerator.LARGE_SCALE) * TerrainGenerator.LARGE_AMP +
                  TerrainGenerator._noise(wx * TerrainGenerator.MEDIUM_SCALE, wz * TerrainGenerator.MEDIUM_SCALE) * TerrainGenerator.MEDIUM_AMP +
                  TerrainGenerator._noise(wx * TerrainGenerator.SMALL_SCALE, wz * TerrainGenerator.SMALL_SCALE) * TerrainGenerator.SMALL_AMP
            );
      }

      /** Smooth value noise (hash-based, no library needed) */
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
