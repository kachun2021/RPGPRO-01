import type { Scene } from '@babylonjs/core/scene';
import type { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { ZoneRenderer } from './ZoneRenderer';
import type { MonsterManager } from '../entities/MonsterManager';
import type { NPCManager } from '../entities/NPC';
import type { DropItemManager } from '../entities/DropItem';
import type { ZoneTransition } from '../ui/ZoneTransition';
import type { Minimap } from '../ui/Minimap';
import { getSceneZoneNeighbors, isSceneZonesConnected } from '../data/runtime/RuntimeWorldRoutes';
import {
      getDefaultRuntimeSceneZoneId,
      getRuntimeSceneZone,
      getRuntimeSceneZoneOrFallback,
      listRuntimeSceneZones,
      type RuntimeSceneZoneDef,
} from './RuntimeZoneCatalog';

/**
 * ZoneManager — Orchestrates zone transitions.
 * dispose old zone → build new zone → respawn monsters → reset player
 */
export class ZoneManager {
      private _scene: Scene;
      private _shadowGen: ShadowGenerator;
      private _renderer: ZoneRenderer | null = null;
      private _currentZone: RuntimeSceneZoneDef;
      private _monsterManager: MonsterManager | null = null;
      private _npcManager: NPCManager | null = null;
      private _dropItemManager: DropItemManager | null = null;
      private _transition: ZoneTransition | null = null;
      private _minimap: Minimap | null = null;
      private _onPlayerReset: ((x: number, z: number) => void) | null = null;

      /** Unlocked zone IDs */
      private _unlockedZones: Set<string> = new Set();

      constructor(scene: Scene, shadowGen: ShadowGenerator) {
            this._scene = scene;
            this._shadowGen = shadowGen;
            this._currentZone = getRuntimeSceneZoneOrFallback(getDefaultRuntimeSceneZoneId());
            this._unlockAround(this._currentZone.id);

            // Fallback: if runtime topology cannot map route, keep all zones unlocked to avoid dead-end.
            if (this._unlockedZones.size <= 1) {
                  for (const zone of listRuntimeSceneZones()) this._unlockedZones.add(zone.id);
            }
      }

      /** Wire dependencies */
      wire(opts: {
            monsterManager: MonsterManager;
            transition: ZoneTransition;
            minimap: Minimap;
            onPlayerReset: (x: number, z: number) => void;
            npcManager?: NPCManager;
            dropItemManager?: DropItemManager;
      }): void {
            this._monsterManager = opts.monsterManager;
            this._transition = opts.transition;
            this._minimap = opts.minimap;
            this._onPlayerReset = opts.onPlayerReset;
            this._npcManager = opts.npcManager ?? null;
            this._dropItemManager = opts.dropItemManager ?? null;
      }

      get currentZone(): RuntimeSceneZoneDef { return this._currentZone; }
      get renderer(): ZoneRenderer | null { return this._renderer; }

      isUnlocked(zoneId: string): boolean {
            return this._unlockedZones.has(zoneId);
      }

      unlockZone(zoneId: string): void {
            this._unlockedZones.add(zoneId);
      }

      getUnlockedZones(): RuntimeSceneZoneDef[] {
            return listRuntimeSceneZones().filter(z => this._unlockedZones.has(z.id));
      }

      /** Build initial zone (no transition animation) */
      async buildInitialZone(zoneId: string): Promise<void> {
            const zoneDef = getRuntimeSceneZone(zoneId);
            if (!zoneDef) return;
            this._currentZone = zoneDef;
            this._unlockAround(zoneDef.id);

            this._renderer = new ZoneRenderer(this._scene, this._shadowGen);
            await this._renderer.build(zoneDef);

            // Spawn monsters
            this._monsterManager?.spawnForZone(zoneDef.id);

            // Spawn NPCs
            this._npcManager?.spawnForZone(zoneDef.id);

            // Update minimap
            this._minimap?.setZoneName(zoneDef.nameCN);

            console.log(`[ZoneManager] Initial zone: ${zoneDef.name}`);
      }

      /** Travel to a new zone with transition animation */
      async travelTo(zoneId: string): Promise<void> {
            const zoneDef = getRuntimeSceneZone(zoneId);
            if (!zoneDef) {
                  console.warn('[ZoneManager] Zone not found:', zoneId);
                  return;
            }

            if (zoneDef.id === this._currentZone.id) return;

            const canByRoute = isSceneZonesConnected(this._currentZone.id, zoneId);
            if (!this.isUnlocked(zoneId) && !canByRoute) {
                  console.warn('[ZoneManager] Zone locked:', zoneId);
                  return;
            }

            console.log(`[ZoneManager] Traveling to: ${zoneDef.name}`);

            // 1. Show transition overlay
            this._transition?.show(zoneDef.nameCN);

            // 2. Wait for fade in
            await this._delay(400);

            // 3. Despawn all monsters
            this._monsterManager?.despawnAll();

            // 3b. Despawn NPCs
            this._npcManager?.despawnAll();

            // 3c. Clear dropped items
            this._dropItemManager?.despawnAll();

            // 4. Dispose old zone renderer
            this._renderer?.dispose();

            // 5. Build new zone
            this._currentZone = zoneDef;
            this._unlockAround(zoneDef.id);
            this._renderer = new ZoneRenderer(this._scene, this._shadowGen);
            await this._renderer.build(zoneDef);

            // 6. Reset player position
            const sp = zoneDef.spawnPoint;
            this._onPlayerReset?.(sp.x, sp.z);

            // 7. Spawn new monsters
            this._monsterManager?.spawnForZone(zoneDef.id);

            // 7b. Spawn NPCs for new zone
            this._npcManager?.spawnForZone(zoneDef.id);

            // 8. Update minimap
            this._minimap?.setZoneName(zoneDef.nameCN);

            // 9. Progress bar animation
            this._transition?.setProgress(100);
            await this._delay(300);

            // 10. Hide transition
            this._transition?.hide();

            console.log(`[ZoneManager] Arrived at: ${zoneDef.name}`);
      }

      private _delay(ms: number): Promise<void> {
            return new Promise(resolve => setTimeout(resolve, ms));
      }

      private _unlockAround(zoneId: string): void {
            this._unlockedZones.add(zoneId);
            const neighbors = getSceneZoneNeighbors(zoneId);
            for (const next of neighbors) this._unlockedZones.add(next);
      }

      dispose(): void {
            this._renderer?.dispose();
            this._renderer = null;
      }
}
