import type { EquipmentSystem, EquipSlot, EquipDef } from '../systems/EquipmentSystem';
import { EQUIP_SLOTS, EQUIP_TEMPLATES } from '../systems/EquipmentSystem';
import type { EnhanceSystem } from '../systems/EnhanceSystem';
import type { Inventory } from '../systems/Inventory';
import type { ItemRarity } from '../systems/DropTable';

const RARITY_COLOR: Record<ItemRarity, string> = {
      common: 'rgba(160,160,160,0.6)',
      uncommon: 'rgba(60,140,255,0.7)',
      rare: 'rgba(155,80,220,0.7)',
      epic: 'rgba(232,201,106,0.8)',
      legendary: 'rgba(255,100,30,0.85)',
};

/**
 * EquipmentPanel — Center popup with humanoid layout for 8 gear slots.
 * Shows equipped gear, stats, set bonuses. Actions: equip, unequip, enhance.
 */
export class EquipmentPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _equipSystem: EquipmentSystem;
      private _enhanceSystem: EnhanceSystem;
      private _inventory: Inventory;

      get element(): HTMLDivElement { return this._el; }

      constructor(equipSystem: EquipmentSystem, enhanceSystem: EnhanceSystem, inventory: Inventory) {
            this._equipSystem = equipSystem;
            this._enhanceSystem = enhanceSystem;
            this._inventory = inventory;

            this._el = document.createElement('div');
            this._el.id = 'equipment-panel';
            this._el.className = 'sa-panel eq-root';
            this._el.style.display = 'none';

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);

            equipSystem.onChange = () => { if (this._visible) this._render(); };
      }

      private _buildShell(): void {
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '⚔️ 裝備';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            const body = document.createElement('div');
            body.className = 'eq-body';
            body.id = 'eq-body';
            this._el.appendChild(body);
      }

      private _render(): void {
            const body = this._el.querySelector('#eq-body') as HTMLDivElement;
            if (!body) return;
            body.innerHTML = '';

            // Top: Set bonus summary
            const setBonuses = this._equipSystem.getSetBonuses();
            if (setBonuses.length > 0) {
                  const setDiv = document.createElement('div');
                  setDiv.className = 'eq-set-summary';
                  for (const sb of setBonuses) {
                        setDiv.innerHTML += `<div class="eq-set-line">🏆 ${sb.set.name} (${sb.count}/8) — ${sb.activeEffects.join(' | ')}</div>`;
                  }
                  body.appendChild(setDiv);
            }

            // Stats summary
            const totalStats = this._equipSystem.getTotalStats();
            const statsDiv = document.createElement('div');
            statsDiv.className = 'eq-stats-bar';
            statsDiv.innerHTML = `⚔️${totalStats.atk} 🛡️${totalStats.def} ❤️${totalStats.hp} 💧${totalStats.mp}`;
            body.appendChild(statsDiv);

            // Humanoid grid: 3x3 layout
            // Row 1:         [head]
            // Row 2: [weapon] [armor] [necklace]
            // Row 3: [gloves]        [ring]
            // Row 4: [bracelet][boots]
            const grid = document.createElement('div');
            grid.className = 'eq-grid';

            const layout: (EquipSlot | null)[][] = [
                  [null, 'head', null],
                  ['weapon', 'armor', 'necklace'],
                  ['gloves', null, 'ring'],
                  ['bracelet', 'boots', null],
            ];

            for (const row of layout) {
                  for (const slotId of row) {
                        const cell = document.createElement('div');
                        cell.className = 'eq-cell';

                        if (slotId) {
                              const slotDef = EQUIP_SLOTS.find(s => s.id === slotId);
                              const equipped = this._equipSystem.getSlot(slotId);

                              cell.classList.add('eq-slot');
                              if (equipped) {
                                    cell.style.borderColor = RARITY_COLOR[equipped.rarity];
                                    cell.innerHTML = `
                                          <span class="eq-item-icon">${equipped.icon}</span>
                                          <span class="eq-enhance">+${equipped.enhanceLevel}</span>
                                    `;
                                    cell.addEventListener('click', () => this._showActions(equipped, slotId));
                              } else {
                                    cell.innerHTML = `<span class="eq-empty-icon">${slotDef?.icon ?? '?'}</span><span class="eq-slot-label">${slotDef?.label ?? ''}</span>`;
                                    cell.addEventListener('click', () => this._showEquipList(slotId));
                              }
                        } else {
                              // Spacer — silhouette center
                              cell.classList.add('eq-spacer');
                        }
                        grid.appendChild(cell);
                  }
            }
            body.appendChild(grid);

            // Bottom: Quick equip from templates (for demo)
            const demoBtn = document.createElement('button');
            demoBtn.className = 'btn-gold eq-demo-btn';
            demoBtn.textContent = '🎁 一鍵穿戴初始裝備';
            demoBtn.addEventListener('click', () => {
                  this._equipSystem.giveStarterGear();
                  this._render();
            });
            body.appendChild(demoBtn);
      }

      private _showActions(equip: EquipDef, slot: EquipSlot): void {
            // Create inline action popup
            const existing = this._el.querySelector('.eq-action-popup');
            if (existing) existing.remove();

            const popup = document.createElement('div');
            popup.className = 'eq-action-popup';

            const rate = this._enhanceSystem.getRate(equip.enhanceLevel);
            const cost = this._enhanceSystem.getCost(equip.enhanceLevel);

            popup.innerHTML = `
                  <div class="eq-act-title" style="color:${RARITY_COLOR[equip.rarity]}">${equip.icon} ${equip.name} +${equip.enhanceLevel}</div>
                  <div class="eq-act-stats">⚔️${equip.stats.atk} 🛡️${equip.stats.def} ❤️${equip.stats.hp} 💧${equip.stats.mp}</div>
                  ${equip.setId ? `<div class="eq-act-set">🏆 套裝: ${equip.setId === 'boss_set' ? 'Boss套裝' : 'PVP套裝'}</div>` : ''}
                  <div class="eq-act-enhance-info">強化成功率: ${Math.round(rate * 100)}% | 費用: ${cost} 金</div>
                  <div class="eq-act-buttons">
                        <button class="inv-tt-btn eq-enhance-btn">⬆ 強化</button>
                        <button class="inv-tt-btn eq-unequip-btn">📤 卸下</button>
                  </div>
            `;

            popup.querySelector('.eq-enhance-btn')?.addEventListener('click', () => {
                  if (this._inventory.gold < cost) {
                        console.log('[Equip] Not enough gold');
                        return;
                  }
                  // Deduct gold
                  (this._inventory as any)._gold -= cost;
                  const result = this._enhanceSystem.enhance(equip, false);
                  this._showEnhanceResult(result.success, equip.name, result.oldLevel, result.newLevel);
                  this._render();
            });

            popup.querySelector('.eq-unequip-btn')?.addEventListener('click', () => {
                  this._equipSystem.unequip(slot);
                  popup.remove();
                  this._render();
            });

            // Close on outside click
            const close = () => { popup.remove(); document.removeEventListener('click', close); };
            setTimeout(() => document.addEventListener('click', close), 10);

            this._el.querySelector('#eq-body')?.appendChild(popup);
      }

      private _showEquipList(slot: EquipSlot): void {
            // Show available equipment for this slot from templates
            const available = EQUIP_TEMPLATES.filter(t => t.slot === slot);
            if (available.length === 0) return;

            const existing = this._el.querySelector('.eq-action-popup');
            if (existing) existing.remove();

            const popup = document.createElement('div');
            popup.className = 'eq-action-popup';
            popup.innerHTML = `<div class="eq-act-title">選擇 ${EQUIP_SLOTS.find(s => s.id === slot)?.label ?? slot}</div>`;

            for (const tmpl of available) {
                  const row = document.createElement('div');
                  row.className = 'eq-equip-row';
                  row.style.borderLeft = `3px solid ${RARITY_COLOR[tmpl.rarity]}`;
                  row.innerHTML = `<span>${tmpl.icon} ${tmpl.name}</span> <span>⚔️${tmpl.stats.atk} 🛡️${tmpl.stats.def}</span>`;
                  row.addEventListener('click', () => {
                        this._equipSystem.equip({ ...tmpl, enhanceLevel: 0 });
                        popup.remove();
                        this._render();
                  });
                  popup.appendChild(row);
            }

            const close = () => { popup.remove(); document.removeEventListener('click', close); };
            setTimeout(() => document.addEventListener('click', close), 10);
            this._el.querySelector('#eq-body')?.appendChild(popup);
      }

      private _showEnhanceResult(success: boolean, name: string, oldLevel: number, newLevel: number): void {
            const el = document.createElement('div');
            el.className = 'pickup-text';
            el.style.color = success ? '#27AE60' : '#E74C3C';
            el.textContent = success
                  ? `✅ ${name} +${oldLevel} → +${newLevel} 成功！`
                  : `❌ ${name} +${oldLevel} → +${newLevel} 強化失敗`;
            document.getElementById('ui-layer')?.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));
            setTimeout(() => el.remove(), 2000);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._render(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
