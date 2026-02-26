import { Registry } from "../core/Registry";

/**
 * HUD — DOM overlay on #ui-layer.
 * Follows GEMINI.md §9 UI design system.
 */
export class HUD {
      private _container!: HTMLDivElement;
      private _hpBar!: HTMLDivElement;
      private _mpBar!: HTMLDivElement;
      private _levelLabel!: HTMLSpanElement;
      private _goldLabel!: HTMLSpanElement;
      private _mounted = false;

      init(): void {
            const uiLayer = document.getElementById("ui-layer");
            if (!uiLayer || this._mounted) return;
            this._mounted = true;

            // ── Top HUD strip ────────────────────────────────────
            this._container = document.createElement("div");
            this._container.id = "hud-top";
            this._container.style.cssText = `
            position:absolute; top:0; left:0; right:0;
            padding: max(env(safe-area-inset-top,8px),8px) 16px 8px 16px;
            pointer-events:none; z-index:10;
            font-family:'Inter',sans-serif; color:#E8E0F0;
        `;
            this._container.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <span style="font-size:11px;opacity:0.6;min-width:22px;">HP</span>
                <div style="flex:1;height:6px;background:rgba(200,190,220,0.15);border-radius:3px;overflow:hidden;">
                    <div id="hud-hp-bar" style="height:100%;width:100%;background:#C4302B;border-radius:3px;transition:width 0.3s;"></div>
                </div>
                <span id="hud-level" style="font-weight:600;font-size:13px;color:#D4A844;min-width:60px;text-align:right;">Lv 1</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:11px;opacity:0.6;min-width:22px;">MP</span>
                <div style="flex:1;height:6px;background:rgba(200,190,220,0.15);border-radius:3px;overflow:hidden;">
                    <div id="hud-mp-bar" style="height:100%;width:100%;background:#3B7DD8;border-radius:3px;transition:width 0.3s;"></div>
                </div>
                <span id="hud-gold" style="font-weight:600;font-size:13px;color:#D4A844;min-width:60px;text-align:right;">💰 0</span>
            </div>
        `;
            uiLayer.appendChild(this._container);

            this._hpBar = document.getElementById("hud-hp-bar") as HTMLDivElement;
            this._mpBar = document.getElementById("hud-mp-bar") as HTMLDivElement;
            this._levelLabel = document.getElementById("hud-level") as HTMLSpanElement;
            this._goldLabel = document.getElementById("hud-gold") as HTMLSpanElement;

            // ── Bottom button row (背包/角色 — P7, P11 expand) ──
            const bottomRow = document.createElement("div");
            bottomRow.id = "hud-bottom-buttons";
            bottomRow.style.cssText = `
            position:absolute; bottom:24px; right:16px;
            display:flex; flex-direction:column; gap:8px;
            pointer-events:auto; z-index:10;
        `;
            bottomRow.innerHTML = `
            <button class="action-btn interactive" id="btn-inventory" style="
                width:44px;height:44px;border-radius:12px;border:1px solid rgba(120,60,255,0.3);
                background:rgba(10,0,20,0.85);color:#E8E0F0;font-size:18px;
                display:flex;align-items:center;justify-content:center;
            ">🎒</button>
            <button class="action-btn interactive" id="btn-character" style="
                width:44px;height:44px;border-radius:12px;border:1px solid rgba(120,60,255,0.3);
                background:rgba(10,0,20,0.85);color:#E8E0F0;font-size:18px;
                display:flex;align-items:center;justify-content:center;
            ">👤</button>
        `;
            uiLayer.appendChild(bottomRow);
      }

      update(): void {
            const p = Registry.player;
            if (!p || !this._mounted) return;
            const s = p.stats;
            this._hpBar.style.width = `${(s.hp / s.maxHp) * 100}%`;
            this._mpBar.style.width = `${(s.mp / s.maxMp) * 100}%`;
            this._levelLabel.textContent = `Lv ${s.level}`;
            this._goldLabel.textContent = `💰 ${s.gold}`;
      }

      dispose(): void {
            this._container?.remove();
            document.getElementById("hud-bottom-buttons")?.remove();
            this._mounted = false;
      }
}
