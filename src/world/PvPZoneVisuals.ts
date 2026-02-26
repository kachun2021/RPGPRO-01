import { Registry } from "../core/Registry";

/**
 * PvPZoneVisuals — 4-layer PvP visual indicators.
 * Peace: green border glow | Plunder: orange pulse | Arena: red flash.
 * Controlled by Registry.pvpMode.
 */
export class PvPZoneVisuals {
      private _overlay!: HTMLDivElement;
      private _mounted = false;

      init(): void {
            const uiLayer = document.getElementById("ui-layer");
            if (!uiLayer || this._mounted) return;
            this._mounted = true;

            this._overlay = document.createElement("div");
            this._overlay.id = "pvp-zone-overlay";
            this._overlay.style.cssText = `
            position:absolute; inset:0; pointer-events:none; z-index:5;
            border: 2px solid transparent;
            transition: border-color 0.5s, box-shadow 0.5s;
        `;
            uiLayer.appendChild(this._overlay);
      }

      update(): void {
            if (!this._mounted) return;
            const mode = Registry.pvpMode;
            switch (mode) {
                  case "peace":
                        this._overlay.style.borderColor = "rgba(68,204,102,0.15)";
                        this._overlay.style.boxShadow = "inset 0 0 30px rgba(68,204,102,0.05)";
                        break;
                  case "plunder":
                        this._overlay.style.borderColor = "rgba(255,165,0,0.3)";
                        this._overlay.style.boxShadow = "inset 0 0 40px rgba(255,165,0,0.1)";
                        break;
                  case "arena":
                        this._overlay.style.borderColor = "rgba(255,50,50,0.4)";
                        this._overlay.style.boxShadow = "inset 0 0 50px rgba(255,50,50,0.15)";
                        break;
            }
      }

      dispose(): void {
            this._overlay?.remove();
            this._mounted = false;
      }
}
