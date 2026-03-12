import type { Pet } from '../pets/Pet';
import type { Inventory } from '../systems/Inventory';
import { createPanelHeader } from './layout/PanelHeader';
import { buildDebugSummary, collectVisibleButtonLabels } from './layout/PanelDebugState';

export class RenamePanel {
      static readonly RENAME_COST = 100;
      readonly panelId = 'rename';
      private _el: HTMLDivElement;
      private _inventory: Inventory;
      private _pet: Pet | null = null;
      private _onDone: (() => void) | null = null;
      private _visible = false;
      private _statusText = '';

      constructor(inventory: Inventory) {
            this._inventory = inventory;
            this._el = document.createElement('div');
            this._el.id = 'renamePanel';
            this._el.className = 'sa-panel rename-root rename-modal ui-panel-atlas';
            this._el.hidden = true;
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      get element(): HTMLElement {
            return this._el;
      }

      get isVisible(): boolean {
            return this._visible;
      }

      getDebugState() {
            return {
                  activeTab: null,
                  visiblePrimaryActions: collectVisibleButtonLabels(this._el, 3),
                  keyDataSummary: buildDebugSummary({
                        petName: this._pet?.displayName ?? null,
                        renameCost: RenamePanel.RENAME_COST,
                        availableGold: this._inventory.gold,
                  }),
            };
      }

      openFor(pet: Pet, onDone?: () => void): void {
            this._pet = pet;
            this._onDone = onDone || null;
            this._statusText = '';
            this._visible = true;
            this._el.hidden = false;
            this._render();
      }

      close(): void {
            this._visible = false;
            this._el.hidden = true;
            this._pet = null;
      }

      show(): void {
            if (this._pet) this.openFor(this._pet, this._onDone ?? undefined);
      }

      hide(): void {
            this.close();
      }

      toggle(): void {
            this._visible ? this.close() : this.show();
      }

      private _render(): void {
            const pet = this._pet;
            if (!pet) return;
            this._el.innerHTML = '';

            const { root: title } = createPanelHeader({
                  icon: 'pet',
                  kicker: 'Identity Edit',
                  title: '寵物更名',
                  subtitle: '確認新名稱後立即套用，費用會從目前 GP 扣除',
                  summaryText: `${RenamePanel.RENAME_COST} GP`,
                  summaryClassName: 'rename-header-pill',
                  closeLabel: '關閉寵物更名面板',
                  closeText: '✕',
                  onClose: () => this.close(),
            });
            this._el.appendChild(title);

            const body = document.createElement('div');
            body.className = 'rename-body';

            const curRow = document.createElement('div');
            curRow.className = 'rename-current-row';
            curRow.innerHTML = `
                  <span class="rename-label-dim">原名稱</span>
                  <span class="rename-current-name">${pet.displayName}</span>
            `;
            body.appendChild(curRow);

            const inputRow = document.createElement('div');
            inputRow.className = 'rename-input-row';

            const label = document.createElement('span');
            label.className = 'rename-label';
            label.textContent = '新名稱';

            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 12;
            input.value = pet.displayName;
            input.className = 'dark-chat-input rename-input';

            inputRow.appendChild(label);
            inputRow.appendChild(input);
            body.appendChild(inputRow);

            const costRow = document.createElement('div');
            costRow.className = 'rename-cost-row';
            costRow.textContent = `更名費用：${RenamePanel.RENAME_COST} GP · 持有 ${this._inventory.gold} GP`;
            body.appendChild(costRow);

            if (this._statusText) {
                  const status = document.createElement('div');
                  status.className = 'rename-status-row';
                  status.textContent = this._statusText;
                  body.appendChild(status);
            }

            const btnRow = document.createElement('div');
            btnRow.className = 'rename-btn-row';

            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-gold rename-confirm-btn';
            confirmBtn.textContent = '確認';
            confirmBtn.disabled = this._inventory.gold < RenamePanel.RENAME_COST;
            confirmBtn.addEventListener('click', () => {
                  const newName = input.value.trim();
                  if (!newName) {
                        this._statusText = '名稱不可為空白。';
                        this._render();
                        return;
                  }
                  if (newName === pet.displayName) {
                        this.close();
                        return;
                  }
                  if (!this._inventory.spendGold(RenamePanel.RENAME_COST)) {
                        this._statusText = 'GP 不足，無法更名。';
                        this._render();
                        return;
                  }
                  pet.nickname = newName;
                  this.close();
                  this._onDone?.();
            });

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'rename-cancel-btn';
            cancelBtn.textContent = '取消';
            cancelBtn.addEventListener('click', () => this.close());

            btnRow.appendChild(confirmBtn);
            btnRow.appendChild(cancelBtn);
            body.appendChild(btnRow);

            this._el.appendChild(body);
      }

      dispose(): void {
            this._el.remove();
      }
}

