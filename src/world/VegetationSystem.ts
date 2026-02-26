import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { TerrainGenerator } from "./TerrainGenerator";

const MAX_PER_CHUNK = 35; // ≤875 total across 5×5 visible chunks (within memory budget)

/**
 * VegetationSystem — placeholder trees/rocks per chunk.
 * ✅ 修復：Y 軸對齊地形高度（不再浮空或插入地面）
 * ✅ 改善：樹木有樹冠，提供更豐富的層次感
 */
export class VegetationSystem {
      /**
       * Populate a chunk with random vegetation items.
       * Returns array of created meshes (for disposal).
       */
      static populate(scene: Scene, ground: Mesh, cx: number, cz: number): Mesh[] {
            const items: Mesh[] = [];
            const rng = VegetationSystem._seededRng(cx, cz);
            const count = 5 + Math.floor(rng() * MAX_PER_CHUNK); // min 5 per chunk
            const chunkSize = 128;
            const worldX = cx * chunkSize + chunkSize / 2;
            const worldZ = cz * chunkSize + chunkSize / 2;

            for (let i = 0; i < count; i++) {
                  const localX = (rng() - 0.5) * chunkSize;
                  const localZ = (rng() - 0.5) * chunkSize;
                  const type = rng(); // 0-0.55 = tree, 0.55-0.8 = rock, 0.8-1.0 = crystal

                  // ✅ 修復：從 TerrainGenerator 獲取準確的地形高度
                  const wx = worldX + localX;
                  const wz = worldZ + localZ;
                  const terrainY = TerrainGenerator.getHeightAt(wx, wz);

                  if (type < 0.55) {
                        // ── Tree (trunk + canopy) ──────────────────
                        const treeHeight = 2.0 + rng() * 3.0;
                        const trunk = MeshBuilder.CreateCylinder(
                              `tree_${cx}_${cz}_${i}`,
                              { height: treeHeight, diameterTop: 0.2, diameterBottom: 0.45, tessellation: 6 },
                              scene
                        );
                        const trunkMat = new StandardMaterial(`trunkMat_${cx}_${cz}_${i}`, scene);
                        trunkMat.diffuseColor = new Color3(0.22, 0.12, 0.08); // 深棕色樹幹
                        trunkMat.emissiveColor = new Color3(0.03, 0.01, 0.01);
                        trunkMat.specularColor = Color3.Black();
                        trunk.material = trunkMat;
                        trunk.position.set(wx, terrainY + treeHeight / 2, wz);
                        trunk.rotation.y = rng() * Math.PI * 2;

                        // Canopy (sphere on top)
                        const canopySize = 1.4 + rng() * 1.2;
                        const canopy = MeshBuilder.CreateSphere(
                              `canopy_${cx}_${cz}_${i}`,
                              { diameter: canopySize, segments: 5 },
                              scene
                        );
                        const canopyMat = new StandardMaterial(`canopyMat_${cx}_${cz}_${i}`, scene);
                        canopyMat.diffuseColor = new Color3(0.18 + rng() * 0.12, 0.10 + rng() * 0.08, 0.28 + rng() * 0.1);
                        canopyMat.emissiveColor = new Color3(0.04, 0.02, 0.06); // 微弱魔法光
                        canopyMat.specularColor = Color3.Black();
                        canopy.material = canopyMat;
                        canopy.position.set(wx, terrainY + treeHeight + canopySize * 0.4, wz);

                        trunk.metadata = { isPlaceholder: true, specId: "vegetation" };
                        canopy.metadata = { isPlaceholder: true, specId: "vegetation" };
                        items.push(trunk, canopy);

                  } else if (type < 0.8) {
                        // ── Rock ──────────────────────────────────
                        const s = 0.5 + rng() * 1.2;
                        const rock = MeshBuilder.CreateBox(
                              `rock_${cx}_${cz}_${i}`,
                              { width: s, height: s * (0.5 + rng() * 0.4), depth: s * (0.6 + rng() * 0.4) },
                              scene
                        );
                        const rockMat = new StandardMaterial(`rockMat_${cx}_${cz}_${i}`, scene);
                        // 灰紫岩石，符合暗黑奇幻色調
                        rockMat.diffuseColor = new Color3(0.22 + rng() * 0.1, 0.15 + rng() * 0.06, 0.28 + rng() * 0.08);
                        rockMat.emissiveColor = new Color3(0.02, 0.01, 0.03);
                        rockMat.specularColor = new Color3(0.08, 0.06, 0.12); // 稍微反光的岩石
                        rock.material = rockMat;
                        rock.position.set(wx, terrainY + (s * 0.3), wz);
                        rock.rotation.y = rng() * Math.PI * 2;
                        rock.rotation.x = (rng() - 0.5) * 0.3; // 帶點傾斜更自然
                        rock.metadata = { isPlaceholder: true, specId: "vegetation" };
                        items.push(rock);

                  } else {
                        // ── Crystal (暗黑奇幻特有！發光水晶) ─────────
                        const ch = 0.8 + rng() * 1.5;
                        const crystal = MeshBuilder.CreateCylinder(
                              `crystal_${cx}_${cz}_${i}`,
                              { height: ch, diameterTop: 0.05, diameterBottom: 0.3, tessellation: 5 },
                              scene
                        );
                        const crystalMat = new StandardMaterial(`crystalMat_${cx}_${cz}_${i}`, scene);
                        crystalMat.diffuseColor = new Color3(0.3, 0.1, 0.6);
                        crystalMat.emissiveColor = new Color3(0.4, 0.1, 0.8); // 紫色發光！
                        crystalMat.alpha = 0.85;
                        crystalMat.specularColor = new Color3(0.5, 0.3, 0.9);
                        crystal.material = crystalMat;
                        crystal.position.set(wx, terrainY + ch / 2, wz);
                        crystal.rotation.y = rng() * Math.PI * 2;
                        crystal.rotation.z = (rng() - 0.5) * 0.5; // 傾斜水晶
                        crystal.metadata = { isPlaceholder: true, specId: "vegetation" };
                        items.push(crystal);
                  }
            }

            return items;
      }

      /** Deterministic seeded RNG per chunk (so chunks regenerate identically) */
      private static _seededRng(cx: number, cz: number): () => number {
            let seed = cx * 374761393 + cz * 668265263 + 12345;
            return () => {
                  seed = (seed ^ (seed >> 13)) * 1274126177;
                  seed = seed ^ (seed >> 16);
                  return (seed & 0x7fffffff) / 0x7fffffff;
            };
      }
}
