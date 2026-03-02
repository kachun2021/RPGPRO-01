import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { ZoneManager } from './ZoneManager';

/**
 * TeleportSystem — Checks player proximity to gates and triggers zone travel.
 */
export class TeleportSystem {
      private _zoneManager: ZoneManager;
      private _getPlayerPos: () => Vector3;
      private _cooldown = 0; // prevent rapid-fire teleports

      constructor(zoneManager: ZoneManager, getPlayerPos: () => Vector3) {
            this._zoneManager = zoneManager;
            this._getPlayerPos = getPlayerPos;
      }

      /** Called every frame from game loop */
      update(dt: number): void {
            if (this._cooldown > 0) {
                  this._cooldown -= dt;
                  return;
            }

            const renderer = this._zoneManager.renderer;
            if (!renderer) return;

            const playerPos = this._getPlayerPos();
            const gates = renderer.getGatePositions();

            for (const gate of gates) {
                  const dist = Vector3.Distance(playerPos, gate.position);
                  if (dist < gate.radius) {
                        // Trigger travel
                        this._cooldown = 3; // 3s cooldown between teleports
                        console.log(`[Teleport] Gate touched: → ${gate.targetZoneId}`);
                        this._zoneManager.travelTo(gate.targetZoneId);
                        return;
                  }
            }
      }

      dispose(): void { /* nothing to dispose */ }
}
