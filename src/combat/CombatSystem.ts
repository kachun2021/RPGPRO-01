import { Registry } from "../core/Registry";
import type { Monster } from "../entities/Monster";

/** Element types for combat reactions */
export type Element = "fire" | "ice" | "lightning" | "shadow" | "none";

export interface DamageResult {
      rawDmg: number;
      finalDmg: number;
      isCrit: boolean;
      element: Element;
      reactionLabel?: string;
}

/**
 * Elemental reaction table:
 * attacker.element + defender.lastElement → multiplier + label
 */
const REACTIONS: Record<string, Record<string, { mult: number; label: string }>> = {
      fire: {
            ice: { mult: 1.85, label: "⚡ Melt" },
            shadow: { mult: 1.40, label: "🔥 Ignite" }
      },
      ice: {
            fire: { mult: 1.85, label: "💥 Shatter" },
            lightning: { mult: 1.55, label: "❄ Freeze" }
      },
      lightning: {
            ice: { mult: 1.55, label: "⚡ Superconduct" },
            shadow: { mult: 1.70, label: "⚡ Thunderclap" }
      },
      shadow: {
            fire: { mult: 1.40, label: "🌑 Void Burn" },
            lightning: { mult: 1.70, label: "💀 Void Storm" }
      },
};

/**
 * CombatSystem — central damage calculation hub.
 * Handles: damage formula, crits, elemental reactions, hit-stop.
 */
export class CombatSystem {
      constructor() {
            Registry.combatSystem = this;
      }

      /**
       * Calculate and apply damage from player to monster.
       * @param target    Monster to receive damage
       * @param element   Element of the attack
       * @param atkMult   Skill multiplier (1.0 = base, 2.5 = heavy skill)
       * @param isAuto    Is this an auto-attack (no elemental)
       */
      attack(target: Monster, element: Element, atkMult = 1.0, isAuto = false): DamageResult {
            const player = Registry.player;
            if (!player) return { rawDmg: 0, finalDmg: 0, isCrit: false, element };

            const atk = player.stats.atk;
            const def = Math.max(0, target.def);

            // Base damage: D = ATK × mult − DEF × 0.4
            const rawDmg = Math.max(1, Math.floor(atk * atkMult - def * 0.4));

            // Crit: 15% base chance, 1.75× multiplier
            const isCrit = !isAuto && Math.random() < 0.15;
            let finalDmg = isCrit ? Math.floor(rawDmg * 1.75) : rawDmg;

            // Elemental reaction
            let reactionLabel: string | undefined;
            if (!isAuto && element !== "none") {
                  const reaction = REACTIONS[element]?.[target.lastElement];
                  if (reaction) {
                        finalDmg = Math.floor(finalDmg * reaction.mult);
                        reactionLabel = reaction.label;
                  }
                  target.lastElement = element;
            }

            // Apply damage
            target.takeDamage(finalDmg, reactionLabel);

            // Hit Stop (freeze monster briefly for impact feel)
            this._hitStop(target, 80);

            return { rawDmg, finalDmg, isCrit, element, reactionLabel };
      }

      /** AOE attack hitting all monsters within radius */
      areaAttack(cx: number, cz: number, radius: number, element: Element, atkMult: number): void {
            const monsters: Monster[] = Registry.monsters ?? [];
            for (const m of monsters) {
                  if (!m.isAlive) continue;
                  const dx = m.root.position.x - cx;
                  const dz = m.root.position.z - cz;
                  if (dx * dx + dz * dz <= radius * radius) {
                        this.attack(m, element, atkMult);
                  }
            }
      }

      private _hitStop(target: Monster, durationMs: number): void {
            if (!target.root) return;
            target.root.setEnabled(false);
            setTimeout(() => { if (target.root && !target.root.isDisposed()) target.root.setEnabled(true); }, durationMs);
      }

      dispose(): void {
            Registry.combatSystem = null;
      }
}
