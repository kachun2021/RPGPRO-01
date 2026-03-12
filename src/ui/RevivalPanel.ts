import type { PetManager } from '../pets/PetManager';
import { SERIES_ICONS } from '../pets/PetData';
import type { Inventory } from '../systems/Inventory';
import { createPanelHeader } from './layout/PanelHeader';
import { buildDebugSummary, collectVisibleButtonLabels } from './layout/PanelDebugState';

export class RevivalPanel {
      readonly panelId = 'revival';
      private _el: HTMLDivElement;
      private _pm: PetManager;
      private _inventory: Inventory;
      private _onDone: (() => void) | null = null;
      private _statusText = '';
      private _visible = false;

      constructor(pm: PetManager, inventory: Inventory) {
            this._pm = pm;
            this._inventory = inventory;
            this._el = document.createElement('div');
            this._el.id = 'revivalPanel';
            this._el.className = 'sa-panel revival-root revival-modal ui-panel-atlas';
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
            const dead = this._pm.owned.filter((pet) => pet.isDead);
            const totalCost = dead.reduce((sum, pet) => sum + pet.revivalCost, 0);
            return {
                  activeTab: null,
                  visiblePrimaryActions: collectVisibleButtonLabels(this._el, 4),
                  keyDataSummary: buildDebugSummary({
                        deadCount: dead.length,
                        totalCost,
                        availableGold: this._inventory.gold,
                  }),
            };
      }

      open(onDone?: () => void): void {
            this._onDone = onDone || null;
            this._statusText = '';
            this._visible = true;
            this._el.hidden = false;
            this._render();
      }

      close(): void {
            this._visible = false;
            this._el.hidden = true;
      }

      show(): void {
            this.open(this._onDone ?? undefined);
      }

      hide(): void {
            this.close();
      }

      toggle(): void {
            this._visible ? this.close() : this.open(this._onDone ?? undefined);
      }

      private _render(): void {
            this._el.innerHTML = '';
            const dead = this._pm.owned.filter((p) => p.isDead);

            const { root: title } = createPanelHeader({
                  icon: 'pet',
                  kicker: 'Recovery Ledger',
                  title: '寵物復活',
                  subtitle: '死亡寵物清單、費用與快速復活操作',
                  summaryText: dead.length > 0 ? `${dead.length} 隻待復活` : '目前無需復活',
                  summaryClassName: 'revival-header-pill',
                  closeLabel: '關閉寵物復活面板',
                  closeText: '✕',
                  onClose: () => this.close(),
            });
            this._el.appendChild(title);

            const body = document.createElement('div');
            body.className = 'revival-body';

            if (dead.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'revival-empty';
                  empty.textContent = this._statusText || '目前沒有死亡寵物';
                  body.appendChild(empty);
                  this._el.appendChild(body);
                  return;
            }

            const totalCost = dead.reduce((sum, p) => sum + p.revivalCost, 0);
            const availableGold = this._inventory.gold;
            const costInfo = document.createElement('div');
            costInfo.className = 'sa-sec revival-cost';
            costInfo.innerHTML = `
                  <span class="revival-cost-label">復活全部寵物費用</span>
                  <span class="revival-cost-value">${totalCost} GP / 持有 ${availableGold} GP</span>
            `;
            body.appendChild(costInfo);

            if (this._statusText) {
                  const status = document.createElement('div');
                  status.className = 'revival-empty';
                  status.textContent = this._statusText;
                  body.appendChild(status);
            }

            const list = document.createElement('div');
            list.className = 'panel-body revival-list';

            for (const pet of dead) {
                  const row = document.createElement('div');
                  row.className = 'list-card revival-row';
                  row.innerHTML = `
                        <div class="revival-row-main">
                              <span class="revival-row-icon"><img src="assets/icons/${SERIES_ICONS[pet.def.series]}" alt=""></span>
                              <div>
                                    <div class="revival-row-name">${pet.displayName}</div>
                                    <div class="revival-row-level">Lv.${pet.stats.level}</div>
                              </div>
                        </div>
                        <span class="revival-row-cost">${pet.revivalCost} GP</span>
                  `;

                  const btn = document.createElement('button');
                  btn.className = 'btn-gold revival-row-btn';
                  btn.textContent = '復活';
                  btn.disabled = availableGold < pet.revivalCost;
                  btn.addEventListener('click', () => {
                        if (!this._inventory.spendGold(pet.revivalCost)) {
                              this._statusText = 'GP 不足，無法復活該寵物。';
                              this._render();
                              return;
                        }
                        this._statusText = `${pet.displayName} 已復活，扣除 ${pet.revivalCost} GP。`;
                        pet.revive();
                        this._render();
                        this._onDone?.();
                  });
                  row.appendChild(btn);
                  list.appendChild(row);
            }

            body.appendChild(list);

            const allRow = document.createElement('div');
            allRow.className = 'revival-actions';

            const allBtn = document.createElement('button');
            allBtn.className = 'btn-gold revival-all-btn';
            allBtn.textContent = '全部復活';
            allBtn.disabled = availableGold < totalCost;
            allBtn.addEventListener('click', () => {
                  if (!this._inventory.spendGold(totalCost)) {
                        this._statusText = 'GP 不足，無法全部復活。';
                        this._render();
                        return;
                  }
                  this._statusText = `全部寵物已復活，扣除 ${totalCost} GP。`;
                  for (const pet of dead) pet.revive();
                  this._render();
                  this._onDone?.();
            });

            const closeBtn2 = document.createElement('button');
            closeBtn2.className = 'revival-close-btn';
            closeBtn2.textContent = '取消';
            closeBtn2.addEventListener('click', () => this.close());

            allRow.appendChild(allBtn);
            allRow.appendChild(closeBtn2);
            body.appendChild(allRow);

            this._el.appendChild(body);
      }

      refresh(): void {
            if (this._visible) this._render();
      }

      dispose(): void {
            this._el.remove();
      }
}

