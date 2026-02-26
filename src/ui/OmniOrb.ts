/**
 * Omni-Orb — bottom-center 80px circle.
 * Tap to expand 4 radial icons (Intent/鍛造/寵物/陣營).
 * Tap outside to collapse. Stagger animation per GEMINI.md §9.
 */
export class OmniOrb {
      private _orb!: HTMLDivElement;
      private _icons: HTMLDivElement[] = [];
      private _overlay!: HTMLDivElement;
      private _expanded = false;
      private _mounted = false;

      private static ICON_DATA = [
            { emoji: "⚔️", label: "Intent", angle: -135 },
            { emoji: "🔨", label: "Forge", angle: -45 },
            { emoji: "🐾", label: "Pet", angle: 135 },
            { emoji: "🏴", label: "Faction", angle: 45 },
      ];

      init(): void {
            const uiLayer = document.getElementById("ui-layer");
            if (!uiLayer || this._mounted) return;
            this._mounted = true;

            // ── Tap-outside overlay (invisible) ──────
            this._overlay = document.createElement("div");
            this._overlay.id = "omni-overlay";
            this._overlay.style.cssText = `
            position:fixed;inset:0;z-index:49;display:none;pointer-events:auto;
        `;
            this._overlay.addEventListener("pointerdown", () => this._collapse());
            uiLayer.appendChild(this._overlay);

            // ── Orb container ──────
            const wrap = document.createElement("div");
            wrap.id = "omni-wrap";
            wrap.style.cssText = `
            position:absolute; bottom:24px; left:50%; transform:translateX(-50%);
            width:80px; height:80px; z-index:50; pointer-events:auto;
        `;

            // ── Main orb ──────
            this._orb = document.createElement("div");
            this._orb.id = "omni-orb";
            this._orb.className = "interactive";
            this._orb.style.cssText = `
            width:80px; height:80px; border-radius:50%;
            background: radial-gradient(circle, rgba(120,60,255,0.4), rgba(20,0,40,0.8));
            border: 2px solid rgba(120,60,255,0.5);
            display:flex; align-items:center; justify-content:center;
            font-size:28px; cursor:pointer; user-select:none;
            box-shadow: 0 0 20px rgba(120,60,255,0.3);
            transition: transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94);
        `;
            this._orb.textContent = "🟣";
            this._orb.addEventListener("pointerdown", (e) => {
                  e.stopPropagation();
                  this._toggle();
            });
            wrap.appendChild(this._orb);

            // ── 4 radial icons ──────
            const radius = 70;
            OmniOrb.ICON_DATA.forEach((item, i) => {
                  const icon = document.createElement("div");
                  icon.className = "action-btn interactive";
                  icon.style.cssText = `
                position:absolute; width:44px; height:44px; border-radius:50%;
                background:rgba(10,0,20,0.9); border:1px solid rgba(120,60,255,0.4);
                display:flex; align-items:center; justify-content:center;
                font-size:18px; cursor:pointer;
                left:50%; top:50%;
                transform: translate(-50%,-50%) scale(0);
                opacity:0; pointer-events:none;
                transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1),
                            opacity 0.2s ease;
                transition-delay: ${i * 50}ms;
            `;
                  icon.title = item.label;
                  icon.textContent = item.emoji;
                  icon.dataset.angle = String(item.angle);
                  icon.addEventListener("pointerdown", (e) => {
                        e.stopPropagation();
                        console.log(`[OmniOrb] ${item.label} tapped`);
                        this._collapse();
                  });
                  wrap.appendChild(icon);
                  this._icons.push(icon);
            });

            uiLayer.appendChild(wrap);
      }

      private _toggle(): void {
            this._expanded ? this._collapse() : this._expand();
      }

      private _expand(): void {
            this._expanded = true;
            this._overlay.style.display = "block";
            this._orb.style.transform = "scale(0.85)";
            const radius = 70;
            this._icons.forEach((icon) => {
                  const angle = Number(icon.dataset.angle) * (Math.PI / 180);
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  icon.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`;
                  icon.style.opacity = "1";
                  icon.style.pointerEvents = "auto";
            });
      }

      private _collapse(): void {
            this._expanded = false;
            this._overlay.style.display = "none";
            this._orb.style.transform = "scale(1)";
            this._icons.forEach((icon) => {
                  icon.style.transform = "translate(-50%,-50%) scale(0)";
                  icon.style.opacity = "0";
                  icon.style.pointerEvents = "none";
            });
      }

      dispose(): void {
            document.getElementById("omni-wrap")?.remove();
            document.getElementById("omni-overlay")?.remove();
            this._mounted = false;
      }
}
