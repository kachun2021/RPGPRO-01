import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { Registry } from "../core/Registry";
import { TerrainGenerator } from "./TerrainGenerator";

const MAX_FOOTPRINTS = 30;      // 減少至 30，節省記憶體
const FOOTPRINT_INTERVAL = 2.5; // 秒

/**
 * PhantomPresence — ghostly footprints
 * ✅ 修復：改用 createInstance() 替代 thinInstanceSetBuffer
 */
export class PhantomPresence {
      private _scene: Scene;
      private _baseMesh!: Mesh;
      private _instances: InstancedMesh[] = [];
      private _timer = 0;

      constructor(scene: Scene) {
            this._scene = scene;
      }

      init(): void {
            // Base footprint mesh — flat disc
            this._baseMesh = MeshBuilder.CreateDisc(
                  "phantomFootprintBase",
                  { radius: 0.25, tessellation: 6 },
                  this._scene
            );
            this._baseMesh.rotation.x = Math.PI / 2;
            this._baseMesh.setEnabled(false); // hide base, only show instances

            const mat = new StandardMaterial("phantomMat", this._scene);
            mat.diffuseColor = new Color3(0.35, 0.18, 0.5);
            mat.emissiveColor = new Color3(0.2, 0.08, 0.35);
            mat.alpha = 0.45;
            mat.specularColor = Color3.Black();
            this._baseMesh.material = mat;
      }

      update(dt: number): void {
            if (!this._baseMesh) return;
            this._timer += dt;
            if (this._timer < FOOTPRINT_INTERVAL) return;
            this._timer = 0;

            const player = Registry.player;
            if (!player) return;

            const pos = player.position;
            const angle = Math.random() * Math.PI * 2;
            const dist = 4 + Math.random() * 8;
            const fx = pos.x + Math.cos(angle) * dist;
            const fz = pos.z + Math.sin(angle) * dist;
            const fy = TerrainGenerator.getHeightAt(fx, fz) + 0.03; // sit on terrain

            // FIFO — recycle oldest instance
            if (this._instances.length >= MAX_FOOTPRINTS) {
                  const oldest = this._instances.shift()!;
                  oldest.position.set(fx, fy, fz);
                  oldest.rotation.y = Math.random() * Math.PI * 2;
                  this._instances.push(oldest);
            } else {
                  const inst = this._baseMesh.createInstance(`fp_${this._instances.length}`);
                  inst.position.set(fx, fy, fz);
                  inst.rotation.y = Math.random() * Math.PI * 2;
                  inst.setEnabled(true);
                  this._instances.push(inst);
            }
      }

      dispose(): void {
            for (const inst of this._instances) inst.dispose();
            this._instances = [];
            this._baseMesh?.dispose();
      }
}
