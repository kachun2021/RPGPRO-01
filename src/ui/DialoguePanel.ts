import type { NPC } from '../entities/NPC';

const NPC_TYPE_LABELS: Record<string, string> = {
      merchant: '商人', skill_master: '技能導師', quest: '任務', pet_trader: '寵物商人',
};

const NPC_TYPE_ICONS: Record<string, string> = {
      merchant: '😈', skill_master: '🛡️', quest: '❗', pet_trader: '🔄',
};

/**
 * DialoguePanel — CHM-style NPC dialogue popup.
 * - Title bar with NPC name
 * - Large text area with watermark portrait
 * - Action buttons as vertical list at bottom
 * - Typewriter text effect
 */
export class DialoguePanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _typewriterInterval = 0;
      private _currentNpc: NPC | null = null;
      private _dialogueIdx = 0;
      private _onAction: ((npc: NPC, action: string) => void) | null = null;

      set onAction(cb: ((npc: NPC, action: string) => void) | null) { this._onAction = cb; }

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'dialogue-panel';
            this._el.className = 'dlg-root';
            this._el.style.display = 'none';
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      openForNpc(npc: NPC): void {
            this._currentNpc = npc;
            this._dialogueIdx = 0;
            this._visible = true;
            this._render();
            this._el.style.display = 'block';
      }

      private _render(): void {
            if (!this._currentNpc) return;
            const npc = this._currentNpc;
            const c = npc.def.color;
            const rgbStr = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
            const icon = NPC_TYPE_ICONS[npc.def.type] || '👤';
            const typeLabel = NPC_TYPE_LABELS[npc.def.type] || 'NPC';

            // Build action buttons based on NPC type
            let actionsHtml = '';
            switch (npc.def.type) {
                  case 'merchant':
                        actionsHtml = `
                              <div class="dlg-action" data-action="buy">💰 買</div>
                              <div class="dlg-action" data-action="sell">📦 賣</div>
                              <div class="dlg-action dlg-action-close" data-action="close">結束對話</div>
                        `;
                        break;
                  case 'skill_master':
                        actionsHtml = `
                              <div class="dlg-action" data-action="why">為什麼要學習技能？</div>
                              <div class="dlg-action" data-action="learn">📖 學習技能</div>
                              <div class="dlg-action dlg-action-close" data-action="close">結束對話</div>
                        `;
                        break;
                  case 'quest':
                        actionsHtml = `
                              <div class="dlg-action" data-action="accept">✅ 接受任務</div>
                              <div class="dlg-action dlg-action-close" data-action="close">結束對話</div>
                        `;
                        break;
                  case 'pet_trader':
                        actionsHtml = `
                              <div class="dlg-action" data-action="trade">🔄 交換寵物</div>
                              <div class="dlg-action" data-action="view">📋 查看列表</div>
                              <div class="dlg-action dlg-action-close" data-action="close">結束對話</div>
                        `;
                        break;
                  default:
                        actionsHtml = `<div class="dlg-action dlg-action-close" data-action="close">結束對話</div>`;
            }

            this._el.innerHTML = `
                  <div class="dlg-header">
                        <span class="dlg-header-icon">${icon}</span>
                        <span class="dlg-header-name">${npc.def.name}</span>
                        <span class="dlg-header-type">${typeLabel}</span>
                  </div>
                  <div class="dlg-body">
                        <div class="dlg-watermark">${icon}</div>
                        <div class="dlg-text-area" id="dlg-text"></div>
                  </div>
                  <div class="dlg-actions" id="dlg-actions">
                        ${actionsHtml}
                  </div>
            `;
            this._el.style.setProperty('--dlg-watermark-color', `rgba(${rgbStr},0.08)`);

            // Type the current dialogue line
            this._typeDialogue(this._dialogueIdx);

            // Action button handlers
            this._el.querySelectorAll('.dlg-action').forEach(btn => {
                  btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const action = (btn as HTMLElement).dataset.action!;
                        if (action === 'close') {
                              this.hide();
                        } else if (action === 'why') {
                              // Show extra dialogue
                              this._dialogueIdx = Math.min(this._dialogueIdx + 1, npc.def.dialogue.length - 1);
                              this._typeDialogue(this._dialogueIdx);
                        } else {
                              this._onAction?.(npc, action);
                              this.hide();
                        }
                  });
            });
      }

      private _typeDialogue(idx: number): void {
            if (!this._currentNpc) return;
            const lines = this._currentNpc.def.dialogue;
            const textEl = this._el.querySelector('#dlg-text') as HTMLDivElement;
            if (!textEl) return;

            // Show all previous lines + typewriter for current
            const prevText = lines.slice(0, idx).join('\n');
            const currentLine = idx < lines.length ? lines[idx] : '';

            textEl.textContent = prevText ? prevText + '\n' : '';
            let charIdx = 0;
            clearInterval(this._typewriterInterval);
            this._typewriterInterval = window.setInterval(() => {
                  if (charIdx < currentLine.length) {
                        textEl.textContent += currentLine[charIdx];
                        charIdx++;
                  } else {
                        clearInterval(this._typewriterInterval);
                  }
            }, 30);
      }

      hide(): void {
            this._visible = false;
            this._el.style.display = 'none';
            clearInterval(this._typewriterInterval);
            this._currentNpc = null;
      }

      get visible(): boolean { return this._visible; }
      dispose(): void { this.hide(); this._el.remove(); }
}
