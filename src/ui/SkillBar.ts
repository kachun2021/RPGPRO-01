export class SkillBar {
      private _el: HTMLDivElement;
      private _slots: HTMLDivElement[] = [];
      private _collapsed = false;
      private _toggleBtn: HTMLDivElement;

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'skillBar';
            this._el.className = 'sa-frame sa-collapsible interactive';
            Object.assign(this._el.style, {
                  position: 'fixed', right: '8px', top: '50%',
                  transform: 'translateY(-50%)', zIndex: '150',
            });

            // Toggle
            this._toggleBtn = document.createElement('div');
            this._toggleBtn.className = 'sa-toggle-btn';
            this._toggleBtn.textContent = '▼ Skills';
            this._toggleBtn.addEventListener('click', () => this._toggleCollapse());
            this._el.appendChild(this._toggleBtn);

            // Content
            const content = document.createElement('div');
            content.id = 'skillContent';
            content.style.cssText = 'display:flex;flex-direction:column;gap:2px;padding:4px';

            for (let i = 1; i <= 8; i++) {
                  const slot = document.createElement('div');
                  slot.className = 'sa-skill-slot';
                  slot.innerHTML = `<span class="sa-skill-label">F${i}</span>`;
                  slot.title = `Skill Slot F${i}`;
                  this._slots.push(slot);
                  content.appendChild(slot);
            }

            this._el.appendChild(content);
            document.getElementById('ui-layer')?.appendChild(this._el);

            // F1-F8 hotkeys
            window.addEventListener('keydown', (e) => {
                  const match = e.key.match(/^F(\d)$/i);
                  if (match) {
                        const idx = parseInt(match[1]) - 1;
                        if (idx >= 0 && idx < 8) {
                              e.preventDefault();
                              this._activateSlot(idx);
                        }
                  }
            });
      }

      /** Set a skill icon in a slot */
      setSkill(slotIndex: number, iconSrc: string, name: string): void {
            if (slotIndex < 0 || slotIndex >= 8) return;
            const slot = this._slots[slotIndex];
            slot.innerHTML = `<img src="${iconSrc}" style="width:32px;height:32px;object-fit:contain" alt="${name}">
      <span class="sa-skill-label">F${slotIndex + 1}</span>`;
            slot.title = name;
      }

      private _activateSlot(idx: number): void {
            const slot = this._slots[idx];
            slot.style.boxShadow = '0 0 8px rgba(232,201,106,0.6)';
            setTimeout(() => { slot.style.boxShadow = ''; }, 200);
            console.log(`[SkillBar] F${idx + 1} activated`);
      }

      private _toggleCollapse(): void {
            this._collapsed = !this._collapsed;
            const content = this._el.querySelector('#skillContent') as HTMLElement;
            content.style.display = this._collapsed ? 'none' : '';
            this._toggleBtn.textContent = this._collapsed ? '▶ Skills' : '▼ Skills';
      }

      dispose(): void { this._el.remove(); }
}
