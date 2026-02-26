import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Scene } from "@babylonjs/core/scene";

// Forward-declare types loosely to avoid circular imports
// Each system sets itself on Registry after construction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySystem = any;

/**
 * Global singleton data bus.
 * Pure data container — NO business logic.
 * All modules communicate exclusively through Registry.
 */
export class Registry {
      // ── Engine ─────────────────────────────────────────
      static engine: AbstractEngine | null = null;
      static scene: Scene | null = null;

      // ── Entities ───────────────────────────────────────
      static player: AnySystem = null;

      // ── World ──────────────────────────────────────────
      static chunkLoader: AnySystem = null;
      static currentZone: string = "起始幽暗森林";
      static unlockedZones: string[] = ["起始幽暗森林"];

      // ── Combat ─────────────────────────────────────────
      static combatSystem: AnySystem = null;
      static aiSystem: AnySystem = null;
      static pvpMode: "peace" | "plunder" | "arena" = "peace";

      // ── Progression ────────────────────────────────────
      static totalKills: number = 0;

      // ── Systems ────────────────────────────────────────
      static inventory: AnySystem = null;
      static questManager: AnySystem = null;
      static shopManager: AnySystem = null;

      // ── Network ────────────────────────────────────────
      static petManager: AnySystem = null;
      static networkManager: AnySystem = null;

      // ── UI ─────────────────────────────────────────────
      static panelManager: AnySystem = null;

      /** Reset all references (for hot-reload / testing) */
      static reset(): void {
            Registry.engine = null;
            Registry.scene = null;
            Registry.player = null;
            Registry.chunkLoader = null;
            Registry.currentZone = "起始幽暗森林";
            Registry.unlockedZones = ["起始幽暗森林"];
            Registry.combatSystem = null;
            Registry.aiSystem = null;
            Registry.pvpMode = "peace";
            Registry.totalKills = 0;
            Registry.inventory = null;
            Registry.questManager = null;
            Registry.shopManager = null;
            Registry.petManager = null;
            Registry.networkManager = null;
            Registry.panelManager = null;
      }
}
