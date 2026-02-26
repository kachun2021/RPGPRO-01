import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { ZONES, type ZoneDefinition } from "./WorldManager";
import { Registry } from "../core/Registry";

interface BarrierWall {
      mesh: Mesh;
      zone: ZoneDefinition;
}

/**
 * BarrierSystem — red translucent barrier walls at zone boundaries.
 * Shows "Zone Lock: Lv XX + Quest X + Kill XXX Required" text.
 * Barrier dissolves when player meets unlock conditions.
 */
export class BarrierSystem {
      private _scene: Scene;
      private _walls: BarrierWall[] = [];

      constructor(scene: Scene) {
            this._scene = scene;
      }

      init(): void {
            // Create barrier walls for locked zones (skip zone 0 — always unlocked)
            for (let i = 1; i < ZONES.length; i++) {
                  const zone = ZONES[i];
                  if (Registry.unlockedZones.includes(zone.name)) continue;
                  this._createBarrier(zone);
            }
      }

      private _createBarrier(zone: ZoneDefinition): void {
            // Create a semi-transparent red wall at zone boundary
            const wall = MeshBuilder.CreatePlane(
                  `barrier_${zone.id}`,
                  { width: 200, height: 30 },
                  this._scene
            );

            // Position at midpoint between zone 0 center and target zone
            const dir = zone.center.subtract(Vector3.Zero()).normalize();
            const midpoint = zone.center.subtract(dir.scale(zone.radius));
            wall.position = new Vector3(midpoint.x, 15, midpoint.z);
            wall.billboardMode = 7; // BILLBOARD_ALL

            // Red translucent material with Fresnel-like glow
            const mat = new StandardMaterial(`barrierMat_${zone.id}`, this._scene);
            mat.diffuseColor = new Color3(0.8, 0.15, 0.15);
            mat.emissiveColor = new Color3(0.6, 0.05, 0.05);
            mat.alpha = 0.25;
            mat.backFaceCulling = false;
            mat.specularColor = Color3.Black();
            wall.material = mat;

            // Pulsing animation
            let phase = 0;
            this._scene.onBeforeRenderObservable.add(() => {
                  phase += 0.02;
                  mat.alpha = 0.15 + Math.sin(phase) * 0.1;
            });

            wall.metadata = {
                  isBarrier: true,
                  zoneId: zone.id,
                  requirement: `Lv ${zone.unlockLevel} | Quest ${zone.unlockQuest} | Kill ${zone.unlockKills}`,
            };

            this._walls.push({ mesh: wall, zone });
      }

      /** Check and remove barriers for newly unlocked zones */
      update(): void {
            for (let i = this._walls.length - 1; i >= 0; i--) {
                  const b = this._walls[i];
                  if (Registry.unlockedZones.includes(b.zone.name)) {
                        // Zone unlocked — dissolve barrier
                        b.mesh.material?.dispose();
                        b.mesh.dispose();
                        this._walls.splice(i, 1);
                        console.log(`[Barrier] ${b.zone.name} barrier dissolved!`);
                  }
            }
      }

      /** Show lock info when player approaches a barrier */
      getBarrierInfo(playerPos: Vector3): string | null {
            for (const b of this._walls) {
                  const dist = Vector3.Distance(playerPos, b.mesh.position);
                  if (dist < 50) {
                        return `🔒 ${b.zone.name}\n${b.mesh.metadata.requirement}`;
                  }
            }
            return null;
      }

      dispose(): void {
            for (const b of this._walls) {
                  b.mesh.material?.dispose();
                  b.mesh.dispose();
            }
            this._walls = [];
      }
}
