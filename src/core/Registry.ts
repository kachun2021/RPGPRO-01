import { Scene } from '@babylonjs/core/scene';
import type { EngineManager } from './EngineManager';

/**
 * Global static registry — filled progressively by each Step.
 * All systems register themselves here for cross-module access.
 */
export class Registry {
      // Core
      static engineManager: EngineManager;
      static scene: Scene;

      // Orientation
      static orientation: 'landscape' | 'portrait' = 'landscape';

      // Player (P2)
      static player: any = null;
      static playerLife: any = null;
      static playerIdentity: any = null;
      static onboarding: any = null;

      // Pets (P3-P4)
      static petManager: any = null;
      static petEncyclopedia: any = null;
      static petEquipment: any = null;

      // Combat (P5)
      static combatSystem: any = null;
      static monsterManager: any = null;

      // World (P6)
      static zoneManager: any = null;
      static currentZoneId: string = 'starter_meadow';

      // Systems (P7+)
      static inventory: any = null;
      static questManager: any = null;
      static equipmentSystem: any = null;

      // Network (P11)
      static networkManager: any = null;

      // UI (P2)
      static hud: any = null;
      static panelManager: any = null;

      // Callbacks
      private static _orientationCallbacks: Array<(o: 'landscape' | 'portrait') => void> = [];

      static onOrientationChange(cb: (o: 'landscape' | 'portrait') => void): void {
            this._orientationCallbacks.push(cb);
      }

      static setOrientation(o: 'landscape' | 'portrait'): void {
            this.orientation = o;
            this._orientationCallbacks.forEach(cb => cb(o));
      }
}
