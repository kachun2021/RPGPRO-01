import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Registry } from "../core/Registry";

// ── Zone definitions (GEMINI.md §10 區域表) ─────────────────────────────────
export interface ZoneDefinition {
      id: string;
      name: string;
      center: Vector3;
      radius: number;           // detection radius
      color: string;            // hex tone for terrain
      colorRGB: [number, number, number]; // normalized for StandardMaterial
      unlockLevel: number;
      unlockQuest: number;      // main quest chapter required
      unlockKills: number;      // total kill count required
}

export const ZONES: ZoneDefinition[] = [
      {
            id: "forest", name: "起始幽暗森林",
            center: new Vector3(0, 0, 0), radius: 900,
            color: "#2D1B3E", colorRGB: [0.28, 0.17, 0.38],
            unlockLevel: 0, unlockQuest: 0, unlockKills: 0,
      },
      {
            id: "swamp", name: "暗影沼澤",
            center: new Vector3(2000, 0, 0), radius: 900,
            color: "#0A3E1B", colorRGB: [0.07, 0.38, 0.17],
            unlockLevel: 10, unlockQuest: 3, unlockKills: 800,
      },
      {
            id: "road", name: "腐朽古道",
            center: new Vector3(4000, 0, 0), radius: 900,
            color: "#3E2B0A", colorRGB: [0.38, 0.27, 0.07],
            unlockLevel: 18, unlockQuest: 7, unlockKills: 2500,
      },
      {
            id: "highland", name: "血月高地",
            center: new Vector3(0, 0, 3000), radius: 900,
            color: "#3E1B0A", colorRGB: [0.38, 0.17, 0.07],
            unlockLevel: 25, unlockQuest: 12, unlockKills: 5000,
      },
      {
            id: "ruins", name: "亡者廢墟",
            center: new Vector3(2000, 0, 3000), radius: 900,
            color: "#1B3E3E", colorRGB: [0.17, 0.38, 0.38],
            unlockLevel: 30, unlockQuest: 18, unlockKills: 8000,
      },
      {
            id: "fortress", name: "血月要塞",
            center: new Vector3(4000, 0, 3000), radius: 900,
            color: "#3E0A0A", colorRGB: [0.38, 0.07, 0.07],
            unlockLevel: 40, unlockQuest: 25, unlockKills: 15000,
      },
];

/**
 * WorldManager — determines currentZone based on player position.
 * 10km × 10km world, 6 zones at fixed world coordinates.
 */
export class WorldManager {
      private _lastZoneId = "";

      init(): void {
            Registry.currentZone = ZONES[0].name;
            this._lastZoneId = ZONES[0].id;
      }

      /** Call every frame (cheap — just distance checks) */
      update(): void {
            const player = Registry.player;
            if (!player) return;

            const pos = player.position;
            let closest: ZoneDefinition = ZONES[0];
            let minDist = Infinity;

            for (const zone of ZONES) {
                  const dx = pos.x - zone.center.x;
                  const dz = pos.z - zone.center.z;
                  const dist = Math.sqrt(dx * dx + dz * dz);
                  if (dist < minDist) {
                        minDist = dist;
                        closest = zone;
                  }
            }

            if (closest.id !== this._lastZoneId) {
                  this._lastZoneId = closest.id;
                  Registry.currentZone = closest.name;
                  console.log(`[World] Zone changed → ${closest.name}`);
            }
      }

      /** Get the zone definition the player is currently in */
      getCurrentZone(): ZoneDefinition {
            return ZONES.find(z => z.name === Registry.currentZone) ?? ZONES[0];
      }

      /** Get zone at a world position (for chunk coloring) */
      static getZoneAt(x: number, z: number): ZoneDefinition {
            let closest: ZoneDefinition = ZONES[0];
            let minDist = Infinity;
            for (const zone of ZONES) {
                  const dx = x - zone.center.x;
                  const dz = z - zone.center.z;
                  const dist = Math.sqrt(dx * dx + dz * dz);
                  if (dist < minDist) {
                        minDist = dist;
                        closest = zone;
                  }
            }
            return closest;
      }
}
