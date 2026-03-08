import type { Player } from '../entities/Player';
import type { PlayerIdentitySnapshot } from '../core/PlayerIdentity';
import { StatAllocation, type BaseStats } from '../systems/StatAllocation';
import { SkillTree, type SkillTreeNode } from '../systems/SkillTree';
import { AwakeningSystem } from '../systems/AwakeningSystem';
import { RebirthSystem } from '../systems/RebirthSystem';

type TabId = 'stats' | 'skilltree' | 'growth';

/**
 * CharacterPanel — Tabbed character info panel.
 * Tab 1: Stats — SVG radar chart + 5 stat rows + derived stats
 * Tab 2: Skill Tree — 3-column (ATK/DEF/Magic) with prerequisites
 * Tab 3: Growth — Awakening + Rebirth conditions & actions
 */
export class CharacterPanel {
      readonly panelId = 'char';
      private _el: HTMLDivElement;
      private _visible = false;
      private _player: Player;
      private _identity: PlayerIdentitySnapshot;
      private _getPrimaryPetName: (() => string | null) | null;
      private _getObjectiveHint: (() => string | null) | null;
      private _onOpenResonance: (() => void) | null;
      private _tab: TabId = 'stats';
      private _fitFrameId = 0;
      private _onResize = (): void => {
            if (!this._visible) return;
            this._scheduleFit();
      };

      // Systems
      private _statAlloc: StatAllocation;
      private _skillTree: SkillTree;
      private _awakening: AwakeningSystem;
      private _rebirth: RebirthSystem;

      constructor(
            player: Player,
            identity: PlayerIdentitySnapshot,
            statAlloc: StatAllocation,
            skillTree: SkillTree,
            awakening: AwakeningSystem,
            rebirth: RebirthSystem,
            options: {
                  getPrimaryPetName?: () => string | null;
                  getObjectiveHint?: () => string | null;
                  onOpenResonance?: () => void;
            } = {},
      ) {
            this._player = player;
            this._identity = identity;
            this._statAlloc = statAlloc;
            this._skillTree = skillTree;
            this._awakening = awakening;
            this._rebirth = rebirth;
            this._getPrimaryPetName = options.getPrimaryPetName ?? null;
            this._getObjectiveHint = options.getObjectiveHint ?? null;
            this._onOpenResonance = options.onOpenResonance ?? null;

            this._el = document.createElement('div');
            this._el.id = 'char-panel';
            this._el.className = 'sa-panel cp-root ui-panel-fullscreen';
            this._el.hidden = true;
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      // ─── Rendering ───

      private _render(): void {
            const s = this._player.stats;
            const pts = this._statAlloc.statPoints;
            const sp = this._skillTree.skillPoints;

            this._el.innerHTML = `
                  <div class="sa-panel-title">
                        角色檔案
                        <span class="panel-close" id="cp-close">×</span>
                  </div>
                  <div class="cp-tabs">
                        <button class="sa-tag${this._tab === 'stats' ? ' sa-tag-active' : ''}" data-tab="stats">
                              配點${pts > 0 ? ` <span class="cp-badge">${pts}</span>` : ''}
                        </button>
                        <button class="sa-tag${this._tab === 'skilltree' ? ' sa-tag-active' : ''}" data-tab="skilltree">
                              技能樹${sp > 0 ? ` <span class="cp-badge">${sp}</span>` : ''}
                        </button>
                        <button class="sa-tag${this._tab === 'growth' ? ' sa-tag-active' : ''}" data-tab="growth">
                              成長
                        </button>
                  </div>
                  <div class="cp-body" id="cp-body"></div>
            `;

            // Tab events
            this._el.querySelector('#cp-close')?.addEventListener('click', () => this.hide());
            this._el.querySelectorAll('.sa-tag[data-tab]').forEach(btn => {
                  btn.addEventListener('click', () => {
                        this._tab = (btn as HTMLElement).dataset.tab as TabId;
                        this._render();
                  });
            });

            const body = this._el.querySelector('#cp-body') as HTMLDivElement;
            switch (this._tab) {
                  case 'stats': this._renderStatsTab(body); break;
                  case 'skilltree': this._renderSkillTreeTab(body); break;
                  case 'growth': this._renderGrowthTab(body); break;
            }

            this._scheduleFit();
      }

      private _scheduleFit(): void {
            if (this._el.classList.contains('ui-panel-fullscreen')) return;
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            this._fitPanelScale();
            this._fitFrameId = requestAnimationFrame(() => this._fitPanelScale());
      }

      get isVisible(): boolean { return this._visible; }

      private _fitPanelScale(): void {
            if (this._el.classList.contains('ui-panel-fullscreen')) {
                  this._el.style.removeProperty('transform');
                  this._el.style.removeProperty('transform-origin');
                  return;
            }
            this._el.style.transformOrigin = 'center center';
            this._el.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');

            const vh = window.innerHeight || 0;
            const available = Math.max(0, Math.floor(vh * 0.88) - 6);
            if (available <= 0) return;

            const needed = this._el.scrollHeight;
            if (needed <= 0 || needed <= available) return;

            const scale = Math.max(0.58, Math.min(1, available / needed));
            this._el.style.setProperty('transform', `translate(-50%, -50%) scale(${scale})`, 'important');
      }

      // ─── Tab 1: Stats ───

      private _renderStatsTab(body: HTMLDivElement): void {
            const s = this._player.stats;
            const bs = this._statAlloc.getEffective();
            const d = this._statAlloc.getDerived();
            const pts = this._statAlloc.statPoints;
            const expNeed = Math.max(1, this._player.expToNext);
            const expPct = ((s.exp / expNeed) * 100).toFixed(1);
            const rebirthInfo = this._rebirth.getInfo();
            const primaryPetName = this._getPrimaryPetName?.() ?? this._identity.starterPetNames[0] ?? '未設定';
            const objectiveHint = this._getObjectiveHint?.() ?? this._identity.growthGoal;

            body.innerHTML = `
                  <div class="cp-header">
                        <div class="cp-portrait"><div class="cp-portrait-inner">👤</div></div>
                        <div class="cp-info">
                              <div class="cp-name">${this._escapeHtml(this._identity.playerName)}${rebirthInfo.count > 0 ? ` ⭐×${rebirthInfo.count}` : ''}</div>
                              <div class="cp-role">${this._escapeHtml(this._identity.heroName)} · ${this._escapeHtml(this._identity.roleLabel)}</div>
                              <div class="cp-row-pair"><span class="cp-label-sm">LV</span><span class="cp-val-sm">${s.level}</span></div>
                              <div class="cp-row-pair"><span class="cp-label-sm">EXP</span><span class="cp-val-sm">${expPct}%</span></div>
                              <div class="cp-row-pair"><span class="cp-label-sm">主寵</span><span class="cp-val-sm">${this._escapeHtml(primaryPetName)}</span></div>
                        </div>
                        ${this._renderRadarSVG(bs)}
                  </div>

                  <div class="cp-focus-strip">
                        <div class="cp-focus-card">
                              <span class="cp-focus-label">成長目標</span>
                              <span class="cp-focus-value">${this._escapeHtml(this._identity.growthGoal)}</span>
                        </div>
                        <div class="cp-focus-card">
                              <span class="cp-focus-label">目前引導</span>
                              <span class="cp-focus-value">${this._escapeHtml(objectiveHint)}</span>
                        </div>
                  </div>

                  <div class="cp-bars">
                        <div class="cp-bar-row">
                              <span class="cp-bar-label">HP</span>
                              <div class="cp-bar-track"><div class="cp-bar-fill cp-hp-fill"></div></div>
                              <span class="cp-bar-val">${s.hp}/${s.maxHp}</span>
                        </div>
                        <div class="cp-bar-row">
                              <span class="cp-bar-label">MP</span>
                              <div class="cp-bar-track"><div class="cp-bar-fill cp-mp-fill"></div></div>
                              <span class="cp-bar-val">${s.mp}/${s.maxMp}</span>
                        </div>
                  </div>

                  <div class="cp-stats-section">
                        ${this._statRow('str', '力 量', bs.str, `⚔️ ATK ${d.atk}`, pts)}
                        ${this._statRow('agi', '敏 捷', bs.agi, `🏃 閃避 ${d.dodgePct}%`, pts)}
                        ${this._statRow('acc', '準 確', bs.acc, `🎯 命中 ${d.hitRate}`, pts)}
                        ${this._statRow('int', '智 力', bs.int, `💧 MP ${d.maxMp}`, pts)}
                        ${this._statRow('attr', '屬 性', bs.attr, `🛡️ DEF ${d.def}`, pts)}
                  </div>

                  <div class="cp-points-row">
                        <span class="cp-points-label">剩餘點數</span>
                        <span class="cp-points-val">${pts}</span>
                        ${rebirthInfo.permanentBonus > 0 ? `<span class="cp-rebirth-bonus">（永久+${rebirthInfo.permanentBonus}）</span>` : ''}
                  </div>

                  <div class="cp-summary">
                        <div class="cp-sum-row"><span>⚔️ ATK</span><span>${d.atk}</span></div>
                        <div class="cp-sum-row"><span>🛡️ DEF</span><span>${d.def}</span></div>
                        <div class="cp-sum-row"><span>❤️ HP</span><span>${d.maxHp}</span></div>
                        <div class="cp-sum-row"><span>💧 MP</span><span>${d.maxMp}</span></div>
                  </div>
            `;
            const hpFill = body.querySelector('.cp-hp-fill') as HTMLDivElement | null;
            if (hpFill) hpFill.style.width = `${(s.hp / s.maxHp) * 100}%`;
            const mpFill = body.querySelector('.cp-mp-fill') as HTMLDivElement | null;
            if (mpFill) mpFill.style.width = `${(s.mp / s.maxMp) * 100}%`;

            // Bind +/- buttons
            body.querySelectorAll('.cp-btn-plus').forEach(btn => {
                  btn.addEventListener('click', () => {
                        const stat = (btn as HTMLElement).dataset.stat as keyof BaseStats;
                        if (this._statAlloc.addPoint(stat)) {
                              this._statAlloc.applyTo(this._player.stats);
                              this._render();
                        }
                  });
            });
            body.querySelectorAll('.cp-btn-minus').forEach(btn => {
                  btn.addEventListener('click', () => {
                        const stat = (btn as HTMLElement).dataset.stat as keyof BaseStats;
                        if (this._statAlloc.removePoint(stat)) {
                              this._statAlloc.applyTo(this._player.stats);
                              this._render();
                        }
                  });
            });
      }

      private _statRow(stat: string, label: string, val: number, derived: string, pts: number): string {
            return `
                  <div class="cp-stat-row">
                        <span class="cp-stat-name">${label}</span>
                        <span class="cp-stat-val">${val}</span>
                        <button class="cp-btn-minus" data-stat="${stat}">−</button>
                        <button class="cp-btn-plus" data-stat="${stat}"${pts <= 0 ? ' disabled' : ''}>＋</button>
                        <span class="cp-derived-label">${derived}</span>
                  </div>`;
      }

      // ─── SVG Radar Chart ───

      private _renderRadarSVG(bs: BaseStats): string {
            const cx = 55, cy = 55, r = 40;
            const stats = [bs.str, bs.agi, bs.acc, bs.int, bs.attr];
            const labels = ['力', '敏', '準', '智', '屬'];
            const maxVal = Math.max(...stats, 20); // dynamic scale
            const angles = stats.map((_, i) => (Math.PI * 2 * i / 5) - Math.PI / 2);

            // Grid polygon
            const gridPts = (scale: number) =>
                  angles.map((a, i) => `${cx + Math.cos(a) * r * scale},${cy + Math.sin(a) * r * scale}`).join(' ');

            // Data polygon
            const dataPts = angles.map((a, i) => {
                  const s = (stats[i] / maxVal) * r;
                  return `${cx + Math.cos(a) * s},${cy + Math.sin(a) * s}`;
            }).join(' ');

            // Labels
            const lbls = angles.map((a, i) => {
                  const lx = cx + Math.cos(a) * (r + 12);
                  const ly = cy + Math.sin(a) * (r + 12);
                  return `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle"
                        fill="rgba(232,201,106,0.8)" font-size="9" font-family="Inter">${labels[i]}</text>`;
            }).join('');

            return `
                  <svg class="cp-radar" viewBox="0 0 110 110" width="100" height="100">
                        <polygon points="${gridPts(1)}" fill="none" stroke="rgba(160,130,80,0.2)" stroke-width="0.5"/>
                        <polygon points="${gridPts(0.66)}" fill="none" stroke="rgba(160,130,80,0.15)" stroke-width="0.5"/>
                        <polygon points="${gridPts(0.33)}" fill="none" stroke="rgba(160,130,80,0.1)" stroke-width="0.5"/>
                        <polygon points="${dataPts}" fill="rgba(232,201,106,0.15)" stroke="rgba(232,201,106,0.7)" stroke-width="1.5"/>
                        ${lbls}
                  </svg>`;
      }

      // ─── Tab 2: Skill Tree ───

      private _renderSkillTreeTab(body: HTMLDivElement): void {
            const sp = this._skillTree.skillPoints;
            const bonuses = this._skillTree.getBonuses();
            const columns: Array<{ key: string; label: string; icon: string }> = [
                  { key: 'atk', label: '攻擊', icon: '⚔️' },
                  { key: 'def', label: '防禦', icon: '🛡️' },
                  { key: 'magic', label: '魔法', icon: '🔮' },
            ];

            let colHtml = '';
            for (const col of columns) {
                  const nodes = this._skillTree.nodes.filter(n => n.column === col.key);
                  const nodeHtml = nodes.map(n => this._renderTreeNode(n)).join('');
                  colHtml += `
                        <div class="st-column">
                              <div class="st-col-header">${col.icon} ${col.label}</div>
                              ${nodeHtml}
                        </div>
                  `;
            }

            body.innerHTML = `
                  <div class="st-sp-row">
                        <span>技能點 (SP): <b>${sp}</b></span>
                        <button class="cp-btn-reset" id="st-reset">🔄 重置</button>
                  </div>
                  <div class="st-grid">${colHtml}</div>
                  <div class="st-bonuses">
                        <div class="st-bonus-title">當前加成</div>
                        ${bonuses.atkPct > 0 ? `<div class="st-bonus-row">⚔️ ATK +${bonuses.atkPct}%</div>` : ''}
                        ${bonuses.critPct > 0 ? `<div class="st-bonus-row">💥 CRIT +${bonuses.critPct}%</div>` : ''}
                        ${bonuses.defPct > 0 ? `<div class="st-bonus-row">🛡️ DEF +${bonuses.defPct}%</div>` : ''}
                        ${bonuses.hpPct > 0 ? `<div class="st-bonus-row">❤️ HP +${bonuses.hpPct}%</div>` : ''}
                        ${bonuses.mpPct > 0 ? `<div class="st-bonus-row">🔮 MP +${bonuses.mpPct}%</div>` : ''}
                        ${bonuses.cdReductionPct > 0 ? `<div class="st-bonus-row">⏱️ CD -${bonuses.cdReductionPct}%</div>` : ''}
                        ${bonuses.berserkerActive ? '<div class="st-bonus-row">🔥 狂戰士就緒</div>' : ''}
                        ${bonuses.unyieldingChance > 0 ? '<div class="st-bonus-row">✨ 不屈就緒</div>' : ''}
                        ${bonuses.petMpPct > 0 ? '<div class="st-bonus-row">💫 寵物MP+10%</div>' : ''}
                  </div>
            `;

            // Learn buttons
            body.querySelectorAll('.st-learn-btn').forEach(btn => {
                  btn.addEventListener('click', () => {
                        const nodeId = (btn as HTMLElement).dataset.nodeId!;
                        if (this._skillTree.learn(nodeId)) this._render();
                  });
            });

            // Reset
            body.querySelector('#st-reset')?.addEventListener('click', () => {
                  this._skillTree.reset();
                  this._render();
            });
      }

      private _renderTreeNode(node: SkillTreeNode): string {
            const canLearn = this._skillTree.canLearn(node.id);
            const isMaxed = node.currentLevel >= node.maxLevel;
            const prereqMet = !node.prereqId || (this._skillTree.getNode(node.prereqId)?.currentLevel ?? 0) >= (this._skillTree.getNode(node.prereqId)?.maxLevel ?? 1);

            let stateClass = 'st-locked';
            if (isMaxed) stateClass = 'st-maxed';
            else if (node.currentLevel > 0) stateClass = 'st-partial';
            else if (prereqMet) stateClass = 'st-available';

            return `
                  <div class="st-node ${stateClass}">
                        <div class="st-node-header">
                              <span class="st-node-icon">${node.icon}</span>
                              <span class="st-node-name">${node.nameCN}</span>
                              <span class="st-node-level">${node.currentLevel}/${node.maxLevel}</span>
                        </div>
                        <div class="st-node-effect">${node.effect}</div>
                        ${!isMaxed ? `<button class="st-learn-btn btn-gold" data-node-id="${node.id}"${!canLearn ? ' disabled' : ''}>
                              ${canLearn ? '學習' : (prereqMet ? '需SP' : '🔒')}
                        </button>` : '<span class="st-maxed-label">✅ 已滿</span>'}
                  </div>
            `;
      }

      // ─── Tab 3: Growth (Awakening & Rebirth) ───

      private _renderGrowthTab(body: HTMLDivElement): void {
            const s = this._player.stats;
            const awStatus = this._awakening.getStatusText(s.level, s.questChapter);
            const canAw = this._awakening.canAwaken(s.level, s.questChapter);
            const rbStatus = this._rebirth.getStatusText(s.level, this._awakening.isAwakened);
            const canRb = this._rebirth.canRebirth(s.level, this._awakening.isAwakened);
            const rbInfo = this._rebirth.getInfo();

            body.innerHTML = `
                  <div class="gw-section">
                        <div class="gw-title">⚡ 覺醒</div>
                        <div class="gw-desc">
                              達到 Lv.${AwakeningSystem.REQUIRED_LEVEL} 且完成主線第 ${AwakeningSystem.REQUIRED_CHAPTER} 章後可覺醒。
                              <br>獎勵：<b>+${AwakeningSystem.STAT_REWARD} 屬性點</b> + <b>+${AwakeningSystem.SP_REWARD} 技能點</b>
                        </div>
                        <div class="gw-status">${awStatus}</div>
                        <button class="btn-gold gw-btn" id="gw-awaken"${!canAw ? ' disabled' : ''}>
                              ${canAw ? '⚡ 覺醒！' : (this._awakening.isAwakened ? '已覺醒 ✅' : '條件未達成')}
                        </button>
                  </div>

                  <div class="gw-divider"></div>

                  <div class="gw-section">
                        <div class="gw-title">🔄 轉生 ${rbInfo.count > 0 ? `(第 ${rbInfo.count} 次)` : ''}</div>
                        <div class="gw-desc">
                              覺醒後達到 Lv.${RebirthSystem.REQUIRED_LEVEL} 可轉生。
                              <br>效果：重置為 Lv.1，永久全屬性 <b>+${RebirthSystem.BONUS_PER_REBIRTH}</b>
                              <br>保留：寵物、裝備、金幣、鑽石
                        </div>
                        ${rbInfo.permanentBonus > 0 ? `<div class="gw-bonus">當前永久加成：全屬性 +${rbInfo.permanentBonus}</div>` : ''}
                        <div class="gw-status">${rbStatus}</div>
                        <button class="btn-gold gw-btn" id="gw-rebirth"${!canRb ? ' disabled' : ''}>
                              ${canRb ? '🔄 轉生！' : '條件未達成'}
                        </button>
                  </div>
                  ${this._onOpenResonance ? `
                  <div class="gw-divider"></div>
                  <div class="gw-section">
                        <div class="gw-title">🔭 共鳴</div>
                        <div class="gw-desc">
                              消耗金幣與共鳴藥提升系列加成。先把主力系列拉起來，再回頭補其他收藏。
                        </div>
                        <button class="btn-gold gw-btn" id="gw-resonance">開啟共鳴</button>
                  </div>
                  ` : ''}
            `;

            // Awakening button
            body.querySelector('#gw-awaken')?.addEventListener('click', () => {
                  if (this._awakening.awaken(s.level, s.questChapter, this._statAlloc, this._skillTree)) {
                        this._render();
                  }
            });

            // Rebirth button
            body.querySelector('#gw-rebirth')?.addEventListener('click', () => {
                  if (confirm('確定要轉生嗎？等級將重置為 1，但獲得永久屬性加成。')) {
                        if (this._rebirth.rebirth(this._player.stats, this._statAlloc, this._skillTree)) {
                              this._render();
                        }
                  }
            });
            body.querySelector('#gw-resonance')?.addEventListener('click', () => {
                  this._onOpenResonance?.();
            });
      }

      // ─── Public API ───

      /** Called on level up to add stat + skill points */
      onLevelUp(): void {
            this._statAlloc.onLevelUp();
            this._skillTree.onLevelUp();
      }

      /** Get stat allocation instance */
      get statAlloc(): StatAllocation { return this._statAlloc; }
      get skillTree(): SkillTree { return this._skillTree; }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void {
            this._visible = true;
            this._el.hidden = false;
            this._render();
      }
      hide(): void {
            this._visible = false;
            this._el.hidden = true;
            if (!this._el.classList.contains('ui-panel-fullscreen')) {
                  this._el.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');
            } else {
                  this._el.style.removeProperty('transform');
                  this._el.style.removeProperty('transform-origin');
            }
      }

      updateIdentity(identity: PlayerIdentitySnapshot): void {
            this._identity = identity;
            if (this._visible) this._render();
      }

      private _escapeHtml(value: string): string {
            return value
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
      }
      dispose(): void {
            if (this._fitFrameId) cancelAnimationFrame(this._fitFrameId);
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
