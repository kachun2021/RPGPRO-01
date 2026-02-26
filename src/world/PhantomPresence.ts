import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { Registry } from "../core/Registry";

const MAX_FOOTPRINTS = 200;
const FOOTPRINT_INTERVAL = 2.0; // seconds between spawns

/**
 * PhantomPresence — ghostly footprints (ThinInstance FIFO)
 * + optional blood splatters. Creates an eerie atmosphere.
 */
export class PhantomPresence {
      private _scene: Scene;
      private _baseMesh!: Mesh;
      private _matrices: Matrix[] = [];
      private _timer = 0;
      private _enabled = true;

      constructor(scene: Scene) {
            this._scene = scene;
      }

      init(): void {
            // Base footprint mesh — flat disc on ground
            this._baseMesh = MeshBuilder.CreateDisc(
                  "phantomFootprint",
                  { radius: 0.2, tessellation: 6 },
                  this._scene
            );
            this._baseMesh.rotation.x = Math.PI / 2; // lay flat
            this._baseMesh.isVisible = false; // base invisible, ThinInstances visible

            const mat = new StandardMaterial("phantomMat", this._scene);
            mat.diffuseColor = new Color3(0.3, 0.2, 0.4);
            mat.emissiveColor = new Color3(0.15, 0.08, 0.25);
            mat.alpha = 0.4;
            mat.specularColor = Color3.Black();
            this._baseMesh.material = mat;
      }

      /** Spawn phantom footprints near player periodically */
      update(dt: number): void {
            if (!this._enabled) return;
            this._timer += dt;
            if (this._timer < FOOTPRINT_INTERVAL) return;
            this._timer = 0;

            const player = Registry.player;
            if (!player) return;

            const pos = player.position;
            // Randomize position near player (5-15m ahead in random direction)
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 10;
            const fx = pos.x + Math.cos(angle) * dist;
            const fz = pos.z + Math.sin(angle) * dist;

            // Create ThinInstance matrix
            const matrix = Matrix.Translation(fx, 0.02, fz);
            this._matrices.push(matrix);

            // FIFO — remove oldest if over limit
            if (this._matrices.length > MAX_FOOTPRINTS) {
                  this._matrices.shift();
            }

            // Update ThinInstances
            this._refreshInstances();
      }

      private _refreshInstances(): void {
            // Pack matrices into Float32Array
            const buf = new Float32Array(this._matrices.length * 16);
            for (let i = 0; i < this._matrices.length; i++) {
                  this._matrices[i].copyToArray(buf, i * 16);
            }
            this._baseMesh.thinInstanceSetBuffer("matrix", buf, 16, true);
            this._baseMesh.isVisible = this._matrices.length > 0;
      }

      dispose(): void {
            this._baseMesh?.dispose();
            this._matrices = [];
      }
}
