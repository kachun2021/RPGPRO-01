import type { Inventory } from '../systems/Inventory';

/**
 * AFKPanel — Portrait AFK statistics panel.
 * Shows kills, exp, gold, items, DPS, time with ticking counters.
 */
export class AFKPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _inventory: Inventory;
      private _startTime = 0;
      private _intervalId = 0;

      constructor(inventory: Inventory) {
            this._inventory = inventory;

            this._el = document.createElement('div');
            this._el.id = 'afk-panel';
            this._el.className = 'sa-panel afk-root';
            this._el.style.display = 'none';

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      private _buildShell(): void {
            this._el.innerHTML = `
                  <div class="sa-panel-title">
                        ⚔️ AFK 掛機統計
                        <span class="panel-close" id="afk-close">×</span>
                  </div>
                  <div class="afk-body">
                        <div class="afk-row"><span class="afk-label">⏱️ 掛機時間</span><span class="afk-value" id="afk-time">00:00:00</span></div>
                        <div class="afk-row"><span class="afk-label">💀 擊殺數</span><span class="afk-value" id="afk-kills">0</span></div>
                        <div class="afk-row"><span class="afk-label">✨ 經驗獲得</span><span class="afk-value" id="afk-exp">0</span></div>
                        <div class="afk-row"><span class="afk-label">💰 金幣獲得</span><span class="afk-value" id="afk-gold">0</span></div>
                        <div class="afk-row"><span class="afk-label">📦 道具拾取</span><span class="afk-value" id="afk-items">0</span></div>
                        <div class="afk-row afk-dps"><span class="afk-label">⚡ DPS</span><span class="afk-value" id="afk-dps">0</span></div>
                        <div class="afk-row"><span class="afk-label">📊 效率</span><span class="afk-value" id="afk-eff">0 金/分</span></div>
                  </div>
            `;

            this._el.querySelector('#afk-close')?.addEventListener('click', () => this.hide());
      }

      private _updateStats(): void {
            const elapsed = (Date.now() - this._startTime) / 1000;
            const h = Math.floor(elapsed / 3600);
            const m = Math.floor((elapsed % 3600) / 60);
            const s = Math.floor(elapsed % 60);

            const setVal = (id: string, val: string) => {
                  const el = this._el.querySelector(`#${id}`);
                  if (el) el.textContent = val;
            };

            setVal('afk-time', `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
            setVal('afk-kills', this._inventory.totalKills.toLocaleString());
            setVal('afk-exp', this._inventory.totalExpGained.toLocaleString());
            setVal('afk-gold', this._inventory.totalGoldGained.toLocaleString());
            setVal('afk-items', this._inventory.totalItemsFound.toLocaleString());

            const dps = elapsed > 0 ? Math.round(this._inventory.totalExpGained / elapsed) : 0;
            setVal('afk-dps', dps.toLocaleString());

            const goldPerMin = elapsed > 60 ? Math.round(this._inventory.totalGoldGained / (elapsed / 60)) : 0;
            setVal('afk-eff', `${goldPerMin.toLocaleString()} 金/分`);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }

      show(): void {
            this._visible = true;
            this._el.style.display = 'block';
            if (this._startTime === 0) this._startTime = Date.now();
            this._updateStats();
            this._intervalId = window.setInterval(() => this._updateStats(), 1000);
      }

      hide(): void {
            this._visible = false;
            this._el.style.display = 'none';
            if (this._intervalId) { clearInterval(this._intervalId); this._intervalId = 0; }
      }

      dispose(): void { this.hide(); this._el.remove(); }
}
