import type { NPC } from '../entities/NPC';

/**
 * DialoguePanel — NPC dialogue with typewriter effect + accept/reject/next buttons.
 * Also handles pet exchange UI.
 */
export class DialoguePanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _typewriterInterval = 0;
      private _currentNpc: NPC | null = null;
      private _dialogueIdx = 0;

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'dialogue-panel';
            this._el.className = 'dlg-root';
            this._el.style.display = 'none';

            this._el.innerHTML = `
                  <div class="dlg-portrait" id="dlg-portrait"></div>
                  <div class="dlg-content">
                        <div class="dlg-name" id="dlg-name"></div>
                        <div class="dlg-text" id="dlg-text"></div>
                        <div class="dlg-buttons" id="dlg-buttons"></div>
                  </div>
            `;
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      openForNpc(npc: NPC): void {
            this._currentNpc = npc;
            this._dialogueIdx = 0;
            this._visible = true;
            this._el.style.display = 'flex';

            // Set portrait color
            const portrait = this._el.querySelector('#dlg-portrait') as HTMLDivElement;
            const c = npc.def.color;
            portrait.style.background = `radial-gradient(circle, rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}), rgba(20,16,30,0.8))`;

            // Set name
            (this._el.querySelector('#dlg-name') as HTMLDivElement).textContent = npc.def.name;

            this._showDialogue(0);
      }

      private _showDialogue(idx: number): void {
            if (!this._currentNpc) return;
            const lines = this._currentNpc.def.dialogue;
            if (idx >= lines.length) { this.hide(); return; }

            this._dialogueIdx = idx;
            const textEl = this._el.querySelector('#dlg-text') as HTMLDivElement;
            const btnContainer = this._el.querySelector('#dlg-buttons') as HTMLDivElement;

            // Typewriter effect
            textEl.textContent = '';
            const text = lines[idx];
            let charIdx = 0;
            clearInterval(this._typewriterInterval);
            this._typewriterInterval = window.setInterval(() => {
                  if (charIdx < text.length) {
                        textEl.textContent += text[charIdx];
                        charIdx++;
                  } else {
                        clearInterval(this._typewriterInterval);
                  }
            }, 30);

            // Buttons
            btnContainer.innerHTML = '';
            const isLast = idx >= lines.length - 1;

            if (isLast) {
                  // Show close button
                  const closeBtn = document.createElement('button');
                  closeBtn.className = 'dlg-btn';
                  closeBtn.textContent = '關閉';
                  closeBtn.addEventListener('click', () => this.hide());
                  btnContainer.appendChild(closeBtn);

                  // Show accept for quest NPCs
                  if (this._currentNpc.def.type === 'quest' || this._currentNpc.def.type === 'pet_trader') {
                        const acceptBtn = document.createElement('button');
                        acceptBtn.className = 'dlg-btn dlg-accept';
                        acceptBtn.textContent = this._currentNpc.def.type === 'pet_trader' ? '🔄 交換' : '✅ 接受';
                        acceptBtn.addEventListener('click', () => {
                              console.log(`[NPC] Accepted from ${this._currentNpc?.def.name}`);
                              this.hide();
                        });
                        btnContainer.appendChild(acceptBtn);
                  }
            } else {
                  const nextBtn = document.createElement('button');
                  nextBtn.className = 'dlg-btn';
                  nextBtn.textContent = '下一頁 ▶';
                  nextBtn.addEventListener('click', () => this._showDialogue(idx + 1));
                  btnContainer.appendChild(nextBtn);
            }
      }

      hide(): void {
            this._visible = false;
            this._el.style.display = 'none';
            clearInterval(this._typewriterInterval);
            this._currentNpc = null;
      }

      dispose(): void { this.hide(); this._el.remove(); }
}
