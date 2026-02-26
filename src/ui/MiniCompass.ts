import { Registry } from "../core/Registry";

/**
 * MiniCompass — 40px circle at top center.
 * Shows cardinal direction arrow + current zone name.
 */
export class MiniCompass {
      private _container!: HTMLDivElement;
      private _arrow!: HTMLDivElement;
      private _zoneLabel!: HTMLDivElement;
      private _mounted = false;

      init(): void {
            const uiLayer = document.getElementById("ui-layer");
            if (!uiLayer || this._mounted) return;
            this._mounted = true;

            this._container = document.createElement("div");
            this._container.id = "mini-compass";
            this._container.style.cssText = `
            position:absolute; top:max(env(safe-area-inset-top,8px),50px); left:50%;
            transform:translateX(-50%);
            display:flex; flex-direction:column; align-items:center; gap:4px;
            pointer-events:none; z-index:10;
        `;

            // Arrow circle
            this._arrow = document.createElement("div");
            this._arrow.style.cssText = `
            width:40px; height:40px; border-radius:50%;
            background:rgba(10,0,20,0.7);
            border:1px solid rgba(120,60,255,0.3);
            display:flex; align-items:center; justify-content:center;
            font-size:16px; color:#D4A844;
            backdrop-filter:blur(6px);
        `;
            this._arrow.textContent = "▲";

            // Zone name
            this._zoneLabel = document.createElement("div");
            this._zoneLabel.style.cssText = `
            font-family:'Cinzel',serif; font-size:11px; font-weight:700;
            color:#D4A844; letter-spacing:2px; opacity:0.8;
            text-shadow: 0 1px 4px rgba(0,0,0,0.6);
            white-space:nowrap;
        `;
            this._zoneLabel.textContent = "起始幽暗森林";

            this._container.appendChild(this._arrow);
            this._container.appendChild(this._zoneLabel);
            uiLayer.appendChild(this._container);
      }

      update(): void {
            if (!this._mounted) return;

            // Update zone name
            const zone = Registry.currentZone || "起始幽暗森林";
            if (this._zoneLabel.textContent !== zone) {
                  this._zoneLabel.textContent = zone;
            }

            // Rotate arrow based on player facing
            const player = Registry.player;
            if (player) {
                  const angle = (player.root?.rotation?.y ?? 0) * (180 / Math.PI);
                  this._arrow.style.transform = `rotate(${-angle}deg)`;
            }
      }

      dispose(): void {
            this._container?.remove();
            this._mounted = false;
      }
}
