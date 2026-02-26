import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import type { Scene } from "@babylonjs/core/scene";
import { TerrainGenerator } from "./TerrainGenerator";

const MAX_PER_CHUNK = 30; // max items per chunk (instances are cheap)

// ── Shared base meshes (created once, reused as instances) ──────────────────
// Key: scene uid → base meshes so we support multiple scenes in tests
interface BaseMeshSet {
      trunk: Mesh;
      canopy: Mesh;
      rock: Mesh;
      crystal: Mesh;
}

const _baseMeshCache = new WeakMap<Scene, BaseMeshSet>();

function _getOrCreateBases(scene: Scene): BaseMeshSet {
      if (_baseMeshCache.has(scene)) return _baseMeshCache.get(scene)!;

      // ── Trunk ──────────────────────────────────────────────────────────────
      const trunk = MeshBuilder.CreateCylinder("__vegTrunk", {
            height: 1, diameterTop: 0.2, diameterBottom: 0.45, tessellation: 6,
      }, scene);
      const trunkMat = new StandardMaterial("__vegTrunkMat", scene);
      trunkMat.diffuseColor = new Color3(0.22, 0.12, 0.08);
      trunkMat.emissiveColor = new Color3(0.04, 0.015, 0.01);
      trunkMat.specularColor = Color3.Black();
      trunk.material = trunkMat;
      trunk.setEnabled(false); // hide base, only instances are visible

      // ── Canopy ─────────────────────────────────────────────────────────────
      const canopy = MeshBuilder.CreateSphere("__vegCanopy", { diameter: 1, segments: 4 }, scene);
      const canopyMat = new StandardMaterial("__vegCanopyMat", scene);
      canopyMat.diffuseColor = new Color3(0.20, 0.10, 0.30);
      canopyMat.emissiveColor = new Color3(0.06, 0.02, 0.10);
      canopyMat.specularColor = Color3.Black();
      canopy.material = canopyMat;
      canopy.setEnabled(false);

      // ── Rock ───────────────────────────────────────────────────────────────
      const rock = MeshBuilder.CreateBox("__vegRock", { width: 1, height: 0.6, depth: 1 }, scene);
      const rockMat = new StandardMaterial("__vegRockMat", scene);
      rockMat.diffuseColor = new Color3(0.24, 0.15, 0.30);
      rockMat.emissiveColor = new Color3(0.025, 0.01, 0.035);
      rockMat.specularColor = new Color3(0.06, 0.05, 0.10);
      rock.material = rockMat;
      rock.setEnabled(false);

      // ── Crystal ────────────────────────────────────────────────────────────
      const crystal = MeshBuilder.CreateCylinder("__vegCrystal", {
            height: 1, diameterTop: 0.05, diameterBottom: 0.3, tessellation: 5,
      }, scene);
      const crystalMat = new StandardMaterial("__vegCrystalMat", scene);
      crystalMat.diffuseColor = new Color3(0.28, 0.08, 0.60);
      crystalMat.emissiveColor = new Color3(0.45, 0.10, 0.90);
      crystalMat.alpha = 0.82;
      crystalMat.specularColor = new Color3(0.5, 0.3, 0.9);
      crystal.material = crystalMat;
      crystal.setEnabled(false);

      const set: BaseMeshSet = { trunk, canopy, rock, crystal };
      _baseMeshCache.set(scene, set);
      return set;
}

export interface VegInstance {
      instances: InstancedMesh[];
}

/**
 * VegetationSystem — 全場景共用 4 個材質 + createInstance()
 * ✅ LAG 修復：材質數 ~2500 → 4，徹底消除 GC 壓力
 * chunk dispose 只需 .dispose() instances，不銷毀材質
 */
export class VegetationSystem {
      static populate(scene: Scene, _ground: Mesh, cx: number, cz: number): InstancedMesh[] {
            const bases = _getOrCreateBases(scene);
            const instances: InstancedMesh[] = [];
            const rng = _seededRng(cx, cz);

            const count = 5 + Math.floor(rng() * MAX_PER_CHUNK);
            const chunkSize = 128;
            const worldX = cx * chunkSize + chunkSize / 2;
            const worldZ = cz * chunkSize + chunkSize / 2;

            for (let i = 0; i < count; i++) {
                  const lx = (rng() - 0.5) * chunkSize;
                  const lz = (rng() - 0.5) * chunkSize;
                  const wx = worldX + lx;
                  const wz = worldZ + lz;
                  const gy = TerrainGenerator.getHeightAt(wx, wz);
                  const t = rng();

                  if (t < 0.50) {
                        // ── Tree ─────────────────────────────────────
                        const h = 2.2 + rng() * 2.8;
                        const ti = bases.trunk.createInstance(`trk_${cx}_${cz}_${i}`);
                        ti.position.set(wx, gy + h * 0.5, wz);
                        ti.scaling.set(1, h, 1);
                        ti.rotation.y = rng() * Math.PI * 2;
                        ti.setEnabled(true);
                        instances.push(ti);

                        const cs = 1.4 + rng() * 1.2;
                        const ci = bases.canopy.createInstance(`cnp_${cx}_${cz}_${i}`);
                        ci.position.set(wx, gy + h + cs * 0.35, wz);
                        ci.scaling.setAll(cs);
                        ci.setEnabled(true);
                        instances.push(ci);

                  } else if (t < 0.78) {
                        // ── Rock ─────────────────────────────────────
                        const s = 0.55 + rng() * 1.1;
                        const ri = bases.rock.createInstance(`rck_${cx}_${cz}_${i}`);
                        ri.position.set(wx, gy + s * 0.28, wz);
                        ri.scaling.set(s, s * (0.55 + rng() * 0.35), s * (0.65 + rng() * 0.35));
                        ri.rotation.y = rng() * Math.PI * 2;
                        ri.rotation.x = (rng() - 0.5) * 0.25;
                        ri.setEnabled(true);
                        instances.push(ri);

                  } else {
                        // ── Crystal (暗黑奇幻特有) ─────────────────────
                        const ch = 0.9 + rng() * 1.6;
                        const xyi = bases.crystal.createInstance(`cry_${cx}_${cz}_${i}`);
                        xyi.position.set(wx, gy + ch * 0.5, wz);
                        xyi.scaling.set(1, ch, 1);
                        xyi.rotation.y = rng() * Math.PI * 2;
                        xyi.rotation.z = (rng() - 0.5) * 0.55;
                        xyi.setEnabled(true);
                        instances.push(xyi);
                  }
            }

            return instances;
      }

      /** Dispose all instances for a chunk (does NOT dispose shared materials) */
      static disposeChunk(instances: InstancedMesh[]): void {
            for (const inst of instances) {
                  inst.dispose();
            }
      }
}

// ── Seeded RNG (same hash as before for determinism) ─────────────────────────
function _seededRng(cx: number, cz: number): () => number {
      let seed = cx * 374761393 + cz * 668265263 + 12345;
      return () => {
            seed = (seed ^ (seed >> 13)) * 1274126177;
            seed = seed ^ (seed >> 16);
            return (seed & 0x7fffffff) / 0x7fffffff;
      };
}
