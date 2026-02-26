import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { Scene } from "@babylonjs/core/scene";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySystem = any;

/**
 * Global singleton data bus.
 * Pure data container — NO business logic.
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

      // ── Combat (P5) ────────────────────────────────────
      static combatSystem: AnySystem = null;
      static skillManager: AnySystem = null;
      static monsters: AnySystem[] = [];   // Monster[]
      static monsterManager: AnySystem = null;
      static floatingDamage: AnySystem = null;
      static dropSystem: AnySystem = null;

      // ── AI (P6) ────────────────────────────────────────
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

      static reset(): void {
            Registry.engine = Registry.scene = Registry.player = null;
            Registry.chunkLoader = null;
            Registry.currentZone = "起始幽暗森林";
            Registry.unlockedZones = ["起始幽暗森林"];
            Registry.combatSystem = Registry.skillManager = null;
            Registry.monsters = [];
            Registry.monsterManager = Registry.floatingDamage = Registry.dropSystem = null;
            Registry.aiSystem = null;
            Registry.pvpMode = "peace";
            Registry.totalKills = 0;
            Registry.inventory = Registry.questManager = Registry.shopManager = null;
            Registry.petManager = Registry.networkManager = null;
            Registry.panelManager = null;
      }
}
