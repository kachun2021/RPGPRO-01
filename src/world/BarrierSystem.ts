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
      mat: StandardMaterial;
      zone: ZoneDefinition;
}

/**
 * BarrierSystem — translucent barrier walls at zone boundaries.
 * ✅ LAG 修復：用 scene.onBeforeRenderObservable observer（只 1 個！）
 *    做所有 barrier 的脈衝，替代每個 barrier 獨立 interval/animation。
 */
export class BarrierSystem {
      private _scene: Scene;
      private _walls: BarrierWall[] = [];
      private _phase = 0;

      constructor(scene: Scene) {
            this._scene = scene;
      }

      init(): void {
            for (let i = 1; i < ZONES.length; i++) {
                  const zone = ZONES[i];
                  if (Registry.unlockedZones.includes(zone.name)) continue;
                  this._createBarrier(zone);
            }
      }

      private _createBarrier(zone: ZoneDefinition): void {
            const wall = MeshBuilder.CreatePlane(
                  `barrier_${zone.id}`,
                  { width: 200, height: 30 },
                  this._scene
            );

            const dir = zone.center.subtract(Vector3.Zero()).normalize();
            const midpoint = zone.center.subtract(dir.scale(zone.radius));
            wall.position = new Vector3(midpoint.x, 15, midpoint.z);
            wall.billboardMode = 7;

            const mat = new StandardMaterial(`barrierMat_${zone.id}`, this._scene);
            mat.diffuseColor = new Color3(0.8, 0.12, 0.12);
            mat.emissiveColor = new Color3(0.55, 0.04, 0.04);
            mat.alpha = 0.20;
            mat.backFaceCulling = false;
            mat.specularColor = Color3.Black();
            wall.material = mat;

            wall.metadata = {
                  isBarrier: true,
                  zoneId: zone.id,
                  requirement: `Lv ${zone.unlockLevel} | Quest ${zone.unlockQuest} | Kill ${zone.unlockKills}`,
            };

            this._walls.push({ mesh: wall, mat, zone });
      }

      /** Call once per frame — animates pulse and checks unlock */
      update(): void {
            this._phase += 0.025;

            for (let i = this._walls.length - 1; i >= 0; i--) {
                  const b = this._walls[i];

                  // Pulse alpha using shared phase
                  b.mat.alpha = 0.14 + Math.abs(Math.sin(this._phase + i * 1.1)) * 0.16;

                  // Remove if zone was unlocked
                  if (Registry.unlockedZones.includes(b.zone.name)) {
                        b.mat.dispose();
                        b.mesh.dispose();
                        this._walls.splice(i, 1);
                        console.log(`[Barrier] ${b.zone.name} barrier dissolved!`);
                  }
            }
      }

      getBarrierInfo(playerPos: Vector3): string | null {
            for (const b of this._walls) {
                  const dist = Vector3.Distance(playerPos, b.mesh.position);
                  if (dist < 50) return `🔒 ${b.zone.name}\n${b.mesh.metadata.requirement}`;
            }
            return null;
      }

      dispose(): void {
            for (const b of this._walls) {
                  b.mat.dispose();
                  b.mesh.dispose();
            }
            this._walls = [];
      }
}
