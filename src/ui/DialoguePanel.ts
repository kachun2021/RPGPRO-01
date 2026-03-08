import type { NPC } from '../entities/NPC';

const NPC_TYPE_LABELS: Record<string, string> = {
      merchant: '商人', skill_master: '技能導師', quest: '任務', pet_trader: '寵物商人',
};

const NPC_TYPE_ICONS: Record<string, string> = {
      merchant: '😈', skill_master: '🛡️', quest: '❗', pet_trader: '🔄',
};

export interface DialogueActionSpec {
      action: string;
      label: string;
      tone?: 'default' | 'close';
}

export interface DialoguePanelOpenOptions {
      lines?: string[];
      actions?: DialogueActionSpec[];
}

/**
 * DialoguePanel — CHM-style NPC dialogue popup.
 * - Title bar with NPC name
 * - Large text area with watermark portrait
 * - Action buttons as vertical list at bottom
 * - Typewriter text effect
 */
export class DialoguePanel {
      readonly panelId = 'dialogue';
      private _el: HTMLDivElement;
      private _visible = false;
      private _typewriterInterval = 0;
      private _currentNpc: NPC | null = null;
      private _dialogueIdx = 0;
      private _lines: string[] = [];
      private _actions: DialogueActionSpec[] = [];
      private _onAction: ((npc: NPC, action: string) => void) | null = null;

      set onAction(cb: ((npc: NPC, action: string) => void) | null) { this._onAction = cb; }

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'dialogue-panel';
            this._el.className = 'dlg-root';
            this._el.hidden = true;
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      get isVisible(): boolean { return this._visible; }
      get visible(): boolean { return this._visible; }

      openForNpc(npc: NPC, options: DialoguePanelOpenOptions = {}): void {
            this._currentNpc = npc;
            this._dialogueIdx = 0;
            this._lines = (options.lines ?? npc.def.dialogue).filter((line) => String(line ?? '').trim().length > 0);
            if (this._lines.length <= 0) {
                  this._lines = npc.def.dialogue.length > 0 ? [...npc.def.dialogue] : ['......'];
            }
            this._actions = options.actions?.length
                  ? options.actions.map((action) => ({ ...action }))
                  : this._buildDefaultActions(npc);
            this._visible = true;
            this._el.hidden = false;
            this._render();
      }

      private _render(): void {
            if (!this._currentNpc) return;
            const npc = this._currentNpc;
            const c = npc.def.color;
            const rgbStr = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
            const icon = NPC_TYPE_ICONS[npc.def.type] || '👤';
            const typeLabel = NPC_TYPE_LABELS[npc.def.type] || 'NPC';

            const actionsHtml = this._actions.map((spec) => `
                  <button type="button" class="dlg-action${spec.tone === 'close' || spec.action === 'close' ? ' dlg-action-close' : ''}" data-action="${this._escapeAttr(spec.action)}">
                        ${this._escapeHtml(spec.label)}
                  </button>
            `).join('');

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
                              this._dialogueIdx = Math.min(this._dialogueIdx + 1, this._lines.length - 1);
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
            const lines = this._lines;
            const textEl = this._el.querySelector('#dlg-text') as HTMLDivElement;
            if (!textEl) return;
            const supportsPaging = this._actions.some((action) => action.action === 'why');

            // Show all previous lines + typewriter for current
            const prevText = supportsPaging ? lines.slice(0, idx).join('\n') : '';
            const currentLine = supportsPaging
                  ? (idx < lines.length ? lines[idx] : '')
                  : lines.join('\n');

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
            this._el.hidden = true;
            clearInterval(this._typewriterInterval);
            this._currentNpc = null;
            this._lines = [];
            this._actions = [];
      }

      show(): void {
            if (!this._currentNpc) return;
            this._visible = true;
            this._el.hidden = false;
            this._render();
      }

      toggle(): void {
            this._visible ? this.hide() : this.show();
      }

      private _buildDefaultActions(npc: NPC): DialogueActionSpec[] {
            switch (npc.def.type) {
                  case 'merchant':
                        return [
                              { action: 'buy', label: '💰 買' },
                              { action: 'sell', label: '📦 賣' },
                              { action: 'close', label: '結束對話', tone: 'close' },
                        ];
                  case 'skill_master':
                        return [
                              { action: 'why', label: '為什麼要學習技能？' },
                              { action: 'learn', label: '📖 學習技能' },
                              { action: 'close', label: '結束對話', tone: 'close' },
                        ];
                  case 'quest':
                        return [
                              { action: 'accept', label: '✅ 接受任務' },
                              { action: 'close', label: '結束對話', tone: 'close' },
                        ];
                  case 'pet_trader':
                        return [
                              { action: 'trade', label: '🔄 交換寵物' },
                              { action: 'view', label: '📋 查看列表' },
                              { action: 'close', label: '結束對話', tone: 'close' },
                        ];
                  default:
                        return [{ action: 'close', label: '結束對話', tone: 'close' }];
            }
      }

      private _escapeHtml(value: string): string {
            return String(value ?? '')
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }

      private _escapeAttr(value: string): string {
            return this._escapeHtml(value).replace(/"/g, '&quot;');
      }

      dispose(): void { this.hide(); this._el.remove(); }
}
