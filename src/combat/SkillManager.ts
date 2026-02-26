import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GPUParticleSystem } from "@babylonjs/core/Particles/gpuParticleSystem";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { Registry } from "../core/Registry";
import { CombatSystem, type Element } from "./CombatSystem";
import type { Monster } from "../entities/Monster";

const PARTICLE_DOT = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJklEQVQYV2P8////fwYiACNIAZZEZEVYFTBiUYRVATYT0RVhNREAx74Hsfh+JcUAAAAASUVORK5CYII=";

interface SkillDef {
      id: string;
      label: string;
      icon: string;       // emoji fallback
      element: Element;
      cooldown: number;       // seconds
      atkMult: number;
      aoeRadius: number;       // 0 = single target
      color: string;       // CSS color for UI
      gradient: string;       // CSS gradient for button
      particleColor1: Color4;
      particleColor2: Color4;
}

const SKILLS: SkillDef[] = [
      {
            id: "fireball", label: "Fire Ball", icon: "🔥",
            element: "fire", cooldown: 2.5, atkMult: 2.1, aoeRadius: 4,
            color: "#FF6030",
            gradient: "radial-gradient(circle, #FF6030, #CC2000)",
            particleColor1: new Color4(1.0, 0.50, 0.10, 1.0),
            particleColor2: new Color4(0.9, 0.10, 0.00, 0.5),
      },
      {
            id: "icespear", label: "Ice Spear", icon: "❄️",
            element: "ice", cooldown: 3.0, atkMult: 2.4, aoeRadius: 0,
            color: "#60C0FF",
            gradient: "radial-gradient(circle, #60C0FF, #0050AA)",
            particleColor1: new Color4(0.55, 0.85, 1.0, 1.0),
            particleColor2: new Color4(0.15, 0.45, 0.90, 0.4),
      },
      {
            id: "lightning", label: "Thunder", icon: "⚡",
            element: "lightning", cooldown: 2.0, atkMult: 1.85, aoeRadius: 6,
            color: "#FFE030",
            gradient: "radial-gradient(circle, #FFE030, #AA8000)",
            particleColor1: new Color4(1.0, 0.95, 0.20, 1.0),
            particleColor2: new Color4(0.60, 0.40, 0.00, 0.4),
      },
      {
            id: "shadow", label: "Dark Wave", icon: "🌑",
            element: "shadow", cooldown: 4.5, atkMult: 3.2, aoeRadius: 8,
            color: "#B040FF",
            gradient: "radial-gradient(circle, #B040FF, #5000CC)",
            particleColor1: new Color4(0.60, 0.10, 1.0, 1.0),
            particleColor2: new Color4(0.25, 0.00, 0.60, 0.3),
      },
];

/**
 * SkillManager — 4 skill slots, cooldowns, DOM buttons, GPUParticle effects.
 * Port: bottom-right corner, arc layout above skill bar.
 */
export class SkillManager {
      private _scene: Scene;
      private _combat: CombatSystem;
      private _cooldowns: number[] = [0, 0, 0, 0];
      private _btns: HTMLElement[] = [];
      private _mounted = false;
      private _particleTex: Texture;

      constructor(scene: Scene, combat: CombatSystem) {
            this._scene = scene;
            this._combat = combat;
            this._particleTex = new Texture(PARTICLE_DOT, scene);
            Registry.skillManager = this;
      }

      init(): void {
            if (this._mounted) return;
            this._mounted = true;

            const ui = document.getElementById("ui-layer");
            if (!ui) return;

            // ── Skill bar wrapper (bottom-right) ──────────────────────────────
            const bar = document.createElement("div");
            bar.id = "skill-bar";
            bar.style.cssText = `
                position: absolute;
                bottom: 28px;
                right: 16px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                pointer-events: auto;
                z-index: 200;
            `;

            SKILLS.forEach((sk, idx) => {
                  const btn = document.createElement("div");
                  btn.id = `skill-btn-${sk.id}`;
                  btn.style.cssText = `
                      width: 56px;
                      height: 56px;
                      border-radius: 14px;
                      background: ${sk.gradient};
                      border: 2px solid rgba(255,255,255,0.22);
                      box-shadow: 0 0 14px ${sk.color}60, inset 0 0 8px rgba(0,0,0,0.35);
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      cursor: pointer;
                      user-select: none;
                      -webkit-user-select: none;
                      position: relative;
                      overflow: hidden;
                      transition: transform 0.1s, box-shadow 0.1s;
                      touch-action: none;
                  `;
                  btn.innerHTML = `
                      <span style="font-size:22px;line-height:1;pointer-events:none;">${sk.icon}</span>
                      <span style="font-size:9px;color:rgba(255,255,255,0.85);font-family:Inter,sans-serif;letter-spacing:0.5px;margin-top:2px;pointer-events:none;">${sk.label}</span>
                      <div id="cd-overlay-${sk.id}" style="
                          position:absolute;inset:0;border-radius:12px;
                          background:conic-gradient(rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) 0%, transparent 0%);
                          pointer-events:none;
                      "></div>
                  `;

                  btn.addEventListener("pointerdown", (e) => {
                        e.preventDefault();
                        this._castSkill(idx);
                  }, { passive: false });

                  btn.addEventListener("pointerenter", () => {
                        btn.style.transform = "scale(1.08)";
                        btn.style.boxShadow = `0 0 22px ${sk.color}90, inset 0 0 8px rgba(0,0,0,0.35)`;
                  });
                  btn.addEventListener("pointerleave", () => {
                        btn.style.transform = "";
                        btn.style.boxShadow = `0 0 14px ${sk.color}60, inset 0 0 8px rgba(0,0,0,0.35)`;
                  });

                  this._btns.push(btn);
                  bar.appendChild(btn);
            });

            ui.appendChild(bar);
      }

      /** Call each frame with deltaTime */
      update(dt: number): void {
            for (let i = 0; i < SKILLS.length; i++) {
                  if (this._cooldowns[i] > 0) {
                        this._cooldowns[i] = Math.max(0, this._cooldowns[i] - dt);
                        this._updateCooldownUI(i);
                  }
            }
      }

      private _castSkill(idx: number): void {
            if (this._cooldowns[idx] > 0) return;
            const sk = SKILLS[idx];
            const player = Registry.player;
            if (!player) return;

            this._cooldowns[idx] = sk.cooldown;
            this._updateCooldownUI(idx);

            // Button press animation
            const btn = this._btns[idx];
            btn.style.transform = "scale(0.88)";
            setTimeout(() => { btn.style.transform = ""; }, 100);

            // Find nearest monster as target
            const target = this._findNearestMonster(player.position, 25);

            if (sk.aoeRadius > 0) {
                  // AOE attack
                  this._combat.areaAttack(
                        player.position.x, player.position.z,
                        sk.aoeRadius, sk.element, sk.atkMult
                  );
                  this._spawnAoeEffect(player.position, sk);
            } else if (target) {
                  // Single target
                  this._combat.attack(target, sk.element, sk.atkMult);
                  this._spawnProjectile(player.position, target, sk);
            }
      }

      private _findNearestMonster(pos: Vector3, maxDist: number): Monster | null {
            const monsters: Monster[] = Registry.monsters ?? [];
            let best: Monster | null = null;
            let bestDist = maxDist * maxDist;
            for (const m of monsters) {
                  if (!m.isAlive) continue;
                  const dx = m.root.position.x - pos.x;
                  const dz = m.root.position.z - pos.z;
                  const d2 = dx * dx + dz * dz;
                  if (d2 < bestDist) { bestDist = d2; best = m; }
            }
            return best;
      }

      private _spawnAoeEffect(center: Vector3, sk: SkillDef): void {
            const cap = 80;
            let ps: GPUParticleSystem | ParticleSystem;
            try {
                  ps = new GPUParticleSystem(`fx_${sk.id}`, { capacity: cap }, this._scene);
            } catch {
                  ps = new ParticleSystem(`fx_${sk.id}`, cap, this._scene);
            }
            ps.particleTexture = this._particleTex;
            ps.emitter = center.clone() as unknown as Vector3;
            ps.minEmitBox = new Vector3(-sk.aoeRadius * 0.5, 0, -sk.aoeRadius * 0.5);
            ps.maxEmitBox = new Vector3(sk.aoeRadius * 0.5, 1, sk.aoeRadius * 0.5);
            ps.color1 = sk.particleColor1;
            ps.color2 = sk.particleColor2;
            ps.colorDead = new Color4(0, 0, 0, 0);
            ps.direction1 = new Vector3(-2, 3, -2);
            ps.direction2 = new Vector3(2, 8, 2);
            ps.gravity = new Vector3(0, -5, 0);
            ps.minLifeTime = 0.4;
            ps.maxLifeTime = 1.0;
            ps.minSize = 0.15;
            ps.maxSize = 0.45;
            ps.emitRate = cap * 2;
            ps.targetStopDuration = 0.25;
            ps.start();
            setTimeout(() => { try { ps.dispose(); } catch { /* already disposed */ } }, 1500);
      }

      private _spawnProjectile(from: Vector3, target: Monster, sk: SkillDef): void {
            // Spawn a small glowing sphere projectile that flies to target
            const proj = MeshBuilder.CreateSphere(`proj_${sk.id}_${Date.now()}`, { diameter: 0.4, segments: 5 }, this._scene);
            proj.position.copyFrom(from);
            proj.position.y += 1.2;

            const mat = new StandardMaterial(`projMat_${sk.id}`, this._scene);
            mat.emissiveColor = new Color3(sk.particleColor1.r, sk.particleColor1.g, sk.particleColor1.b);
            mat.disableLighting = true;
            proj.material = mat;

            const dst = target.root.position.clone();
            dst.y += 1;
            const totalDist = Vector3.Distance(from, dst);
            const speed = 18; // m/s
            let elapsed = 0;
            const duration = totalDist / speed;

            const obs = this._scene.onBeforeRenderObservable.add(() => {
                  const dt = this._scene.getEngine().getDeltaTime() / 1000;
                  elapsed += dt;
                  const t = Math.min(elapsed / duration, 1);
                  proj.position = Vector3.Lerp(from, dst, t);
                  if (t >= 1) {
                        this._scene.onBeforeRenderObservable.remove(obs);
                        this._spawnAoeEffect(dst, sk);
                        mat.dispose();
                        proj.dispose();
                  }
            });
      }

      private _updateCooldownUI(idx: number): void {
            const sk = SKILLS[idx];
            const cd = this._cooldowns[idx];
            const overlay = document.getElementById(`cd-overlay-${sk.id}`);
            if (!overlay) return;
            const pct = cd / sk.cooldown;
            overlay.style.background = pct > 0
                  ? `conic-gradient(rgba(0,0,0,0.72) ${(pct * 360).toFixed(0)}deg, transparent ${(pct * 360).toFixed(0)}deg)`
                  : "none";
      }

      dispose(): void {
            document.getElementById("skill-bar")?.remove();
            this._particleTex.dispose();
      }
}
