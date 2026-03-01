/**
 * SkillBar — Dark premium theme, F1-F8 vertical slots
 */
export class SkillBar {
      private _el: HTMLDivElement;
      private _collapsed = false;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            this._el = document.createElement('div');
            this._el.id = 'skillBar';
            this._el.className = 'interactive';
            Object.assign(this._el.style, {
                  position: 'fixed', right: '4px', top: '76px', zIndex: '150',
                  display: 'flex', flexDirection: 'column', gap: '2px',
                  background: 'linear-gradient(180deg, rgba(20,16,30,0.85), rgba(12,10,20,0.9))',
                  border: '1px solid rgba(160,130,80,0.25)',
                  borderRadius: '6px', padding: '4px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
            });

            // Toggle
            const toggle = document.createElement('div');
            toggle.style.cssText = 'font-size:9px;color:rgba(232,201,106,0.6);text-align:center;cursor:pointer;padding:2px';
            toggle.textContent = '▼ Skills';
            toggle.addEventListener('click', () => {
                  this._collapsed = !this._collapsed;
                  slots.forEach(s => s.style.display = this._collapsed ? 'none' : '');
                  toggle.textContent = this._collapsed ? '▶ Skills' : '▼ Skills';
            });
            this._el.appendChild(toggle);

            // 8 skill slots
            const slots: HTMLDivElement[] = [];
            for (let i = 0; i < 8; i++) {
                  const slot = document.createElement('div');
                  slot.className = 'dark-skill-slot';
                  slot.innerHTML = `<span class="dark-skill-key">F${i + 1}</span>`;
                  slot.addEventListener('click', () => console.log(`[Skill] F${i + 1}`));
                  this._el.appendChild(slot);
                  slots.push(slot);
            }

            // Keyboard hotkeys
            window.addEventListener('keydown', (e) => {
                  const match = e.key.match(/^F(\d)$/);
                  if (match) {
                        const idx = parseInt(match[1]) - 1;
                        if (idx >= 0 && idx < 8) {
                              e.preventDefault();
                              slots[idx].style.background = 'rgba(232,201,106,0.2)';
                              setTimeout(() => slots[idx].style.background = '', 150);
                        }
                  }
            });

            uiLayer.appendChild(this._el);
      }

      dispose(): void { this._el.remove(); }
}
