import type { Player, PlayerStats } from '../entities/Player';

/**
 * CharacterPanel — Stat allocation UI (角色信息).
 * Design based on CHM reference: portrait + level/EXP + HP/MP + 
 * 5 stat rows with +/- buttons + derived stats + remaining points.
 */
export class CharacterPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _player: Player;

      // Stat allocation
      private _statPoints = 0;
      private _baseStats = { str: 5, agi: 5, acc: 5, int: 5, attr: 5 };

      constructor(player: Player) {
            this._player = player;
            this._statPoints = 0;

            this._el = document.createElement('div');
            this._el.id = 'char-panel';
            this._el.className = 'sa-panel cp-root';
            this._el.style.display = 'none';
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      private _render(): void {
            const s = this._player.stats;
            const bs = this._baseStats;

            // Derived stats from base
            const derivedAtk = Math.round(bs.str * 2.5);
            const derivedDef = Math.round(bs.acc * 1.5);
            const derivedHp = bs.str * 10 + bs.acc * 5;
            const derivedMp = bs.int * 8;
            const derivedDodge = (bs.agi * 0.3).toFixed(1);
            const derivedHit = Math.round(bs.acc * 2);

            const expPct = s.level > 0 ? ((s.exp / (s.level * 100)) * 100).toFixed(1) : '0.0';
            const pts = this._statPoints;

            this._el.innerHTML = `
                  <div class="sa-panel-title">
                        📊 角色信息
                        <span class="panel-close" id="cp-close">×</span>
                  </div>
                  <div class="cp-body">
                        <!-- Header: Portrait + Info -->
                        <div class="cp-header">
                              <div class="cp-portrait">
                                    <div class="cp-portrait-inner">👤</div>
                              </div>
                              <div class="cp-info">
                                    <div class="cp-name">Player</div>
                                    <div class="cp-row-pair">
                                          <span class="cp-label-sm">LV</span>
                                          <span class="cp-val-sm">${s.level}</span>
                                    </div>
                                    <div class="cp-row-pair">
                                          <span class="cp-label-sm">EXP</span>
                                          <span class="cp-val-sm">${expPct}%</span>
                                    </div>
                              </div>
                        </div>

                        <!-- HP/MP bars -->
                        <div class="cp-bars">
                              <div class="cp-bar-row">
                                    <span class="cp-bar-label">HP</span>
                                    <div class="cp-bar-track">
                                          <div class="cp-bar-fill cp-hp-fill" style="width:${(s.hp / s.maxHp) * 100}%"></div>
                                    </div>
                                    <span class="cp-bar-val">${s.hp}/${s.maxHp}</span>
                              </div>
                              <div class="cp-bar-row">
                                    <span class="cp-bar-label">MP</span>
                                    <div class="cp-bar-track">
                                          <div class="cp-bar-fill cp-mp-fill" style="width:${(s.mp / s.maxMp) * 100}%"></div>
                                    </div>
                                    <span class="cp-bar-val">${s.mp}/${s.maxMp}</span>
                              </div>
                        </div>

                        <!-- Stat Allocation -->
                        <div class="cp-stats-section">
                              <div class="cp-stat-row" data-stat="str">
                                    <span class="cp-stat-name">力 量</span>
                                    <span class="cp-stat-val">${bs.str}</span>
                                    <button class="cp-btn-minus" data-stat="str">−</button>
                                    <button class="cp-btn-plus" data-stat="str"${pts <= 0 ? ' disabled' : ''}>＋</button>
                                    <span class="cp-derived-label">攻擊力</span>
                                    <span class="cp-derived-val">${derivedAtk}</span>
                              </div>
                              <div class="cp-stat-row" data-stat="agi">
                                    <span class="cp-stat-name">敏 捷</span>
                                    <span class="cp-stat-val">${bs.agi}</span>
                                    <button class="cp-btn-minus" data-stat="agi">−</button>
                                    <button class="cp-btn-plus" data-stat="agi"${pts <= 0 ? ' disabled' : ''}>＋</button>
                                    <span class="cp-derived-label">閃避率</span>
                                    <span class="cp-derived-val">${derivedDodge}%</span>
                              </div>
                              <div class="cp-stat-row" data-stat="acc">
                                    <span class="cp-stat-name">準 確</span>
                                    <span class="cp-stat-val">${bs.acc}</span>
                                    <button class="cp-btn-minus" data-stat="acc">−</button>
                                    <button class="cp-btn-plus" data-stat="acc"${pts <= 0 ? ' disabled' : ''}>＋</button>
                                    <span class="cp-derived-label">命中率</span>
                                    <span class="cp-derived-val">${derivedHit}</span>
                              </div>
                              <div class="cp-stat-row" data-stat="int">
                                    <span class="cp-stat-name">智 力</span>
                                    <span class="cp-stat-val">${bs.int}</span>
                                    <button class="cp-btn-minus" data-stat="int">−</button>
                                    <button class="cp-btn-plus" data-stat="int"${pts <= 0 ? ' disabled' : ''}>＋</button>
                                    <span class="cp-derived-label">MP上限</span>
                                    <span class="cp-derived-val">${derivedMp}</span>
                              </div>
                              <div class="cp-stat-row" data-stat="attr">
                                    <span class="cp-stat-name">屬 性</span>
                                    <span class="cp-stat-val">${bs.attr}</span>
                                    <button class="cp-btn-minus" data-stat="attr">−</button>
                                    <button class="cp-btn-plus" data-stat="attr"${pts <= 0 ? ' disabled' : ''}>＋</button>
                                    <span class="cp-derived-label">防禦力</span>
                                    <span class="cp-derived-val">${derivedDef}</span>
                              </div>
                        </div>

                        <!-- Remaining Points -->
                        <div class="cp-points-row">
                              <span class="cp-points-label">剩餘點數</span>
                              <span class="cp-points-val">${pts}</span>
                        </div>

                        <!-- Summary stats -->
                        <div class="cp-summary">
                              <div class="cp-sum-row"><span>⚔️ ATK</span><span>${derivedAtk + s.atk}</span></div>
                              <div class="cp-sum-row"><span>🛡️ DEF</span><span>${derivedDef + s.def}</span></div>
                              <div class="cp-sum-row"><span>❤️ HP</span><span>${derivedHp}</span></div>
                              <div class="cp-sum-row"><span>💧 MP</span><span>${derivedMp}</span></div>
                        </div>
                  </div>
            `;

            // Bind events
            this._el.querySelector('#cp-close')?.addEventListener('click', () => this.hide());

            this._el.querySelectorAll('.cp-btn-plus').forEach(btn => {
                  btn.addEventListener('click', () => {
                        const stat = (btn as HTMLElement).dataset.stat as keyof typeof this._baseStats;
                        if (this._statPoints > 0) {
                              this._baseStats[stat]++;
                              this._statPoints--;
                              this._applyStats();
                              this._render();
                        }
                  });
            });

            this._el.querySelectorAll('.cp-btn-minus').forEach(btn => {
                  btn.addEventListener('click', () => {
                        const stat = (btn as HTMLElement).dataset.stat as keyof typeof this._baseStats;
                        if (this._baseStats[stat] > 1) {
                              this._baseStats[stat]--;
                              this._statPoints++;
                              this._applyStats();
                              this._render();
                        }
                  });
            });
      }

      /** Apply base stats to player */
      private _applyStats(): void {
            const bs = this._baseStats;
            const s = this._player.stats;
            s.maxHp = bs.str * 10 + bs.acc * 5;
            s.maxMp = bs.int * 8;
            s.hp = Math.min(s.hp, s.maxHp);
            s.mp = Math.min(s.mp, s.maxMp);
      }

      /** Called on level up to add points */
      addPoints(points: number): void {
            this._statPoints += points;
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._render(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
