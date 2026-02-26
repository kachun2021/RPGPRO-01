import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";

const MAX_PER_CHUNK = 40; // ≤500 total across visible chunks

/**
 * VegetationSystem — ThinInstance placeholder trees/rocks per chunk.
 * Uses simple Box/Cylinder geometry as placeholders.
 */
export class VegetationSystem {
      /**
       * Populate a chunk with random vegetation items.
       * Returns array of created meshes (for disposal).
       */
      static populate(scene: Scene, ground: Mesh, cx: number, cz: number): Mesh[] {
            const items: Mesh[] = [];
            const rng = VegetationSystem._seededRng(cx, cz);
            const count = Math.floor(rng() * MAX_PER_CHUNK);
            const chunkSize = 128;
            const worldX = cx * chunkSize + chunkSize / 2;
            const worldZ = cz * chunkSize + chunkSize / 2;

            for (let i = 0; i < count; i++) {
                  const localX = (rng() - 0.5) * chunkSize;
                  const localZ = (rng() - 0.5) * chunkSize;
                  const isTree = rng() > 0.4;

                  let mesh: Mesh;
                  if (isTree) {
                        // Tree = cylinder trunk + sphere canopy
                        mesh = MeshBuilder.CreateCylinder(
                              `tree_${cx}_${cz}_${i}`,
                              { height: 1.5 + rng() * 2, diameterTop: 0.15, diameterBottom: 0.3, tessellation: 6 },
                              scene
                        );
                        const mat = new StandardMaterial(`treeMat_${i}`, scene);
                        mat.diffuseColor = new Color3(0.25, 0.12 + rng() * 0.08, 0.35);
                        mat.specularColor = Color3.Black();
                        mesh.material = mat;
                  } else {
                        // Rock = small box
                        const s = 0.4 + rng() * 0.8;
                        mesh = MeshBuilder.CreateBox(
                              `rock_${cx}_${cz}_${i}`,
                              { width: s, height: s * 0.6, depth: s },
                              scene
                        );
                        const mat = new StandardMaterial(`rockMat_${i}`, scene);
                        mat.diffuseColor = new Color3(0.18, 0.12, 0.22);
                        mat.specularColor = Color3.Black();
                        mesh.material = mat;
                  }

                  mesh.position.x = worldX + localX;
                  mesh.position.z = worldZ + localZ;
                  mesh.position.y = isTree ? 0.75 : 0.2;
                  mesh.rotation.y = rng() * Math.PI * 2;
                  mesh.metadata = { isPlaceholder: true, specId: "vegetation" };
                  items.push(mesh);
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
