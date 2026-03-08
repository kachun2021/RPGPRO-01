import { formatStarterPetSummary } from '../core/PlayerIdentity';
import type { OnboardingManager } from '../systems/OnboardingManager';

export class OnboardingPanel {
      private readonly _manager: OnboardingManager;
      private readonly _el: HTMLDivElement;
      private _disposeListener: (() => void) | null = null;

      constructor(manager: OnboardingManager) {
            this._manager = manager;
            this._el = document.createElement('div');
            this._el.className = 'guide-root interactive';
            document.getElementById('ui-layer')?.appendChild(this._el);
            this._disposeListener = manager.subscribe(() => this._render());
            this._render();
      }

      private _render(): void {
            if (!this._manager.shouldRenderWidget) {
                  this._el.hidden = true;
                  return;
            }

            this._el.hidden = false;
            const identity = this._manager.identity;
            const current = this._manager.currentStep;
            const progress = this._manager.progress;

            if (this._manager.collapsed) {
                  this._el.innerHTML = `
                        <button class="guide-pill" type="button" aria-label="展開新手導引">
                              <span class="guide-pill-kicker">新手導引</span>
                              <span class="guide-pill-text">${current?.title ?? '查看下一步目標'}</span>
                              <span class="guide-pill-progress">${progress.completed}/${progress.total}</span>
                        </button>
                  `;
                  this._el.querySelector('.guide-pill')?.addEventListener('click', () => {
                        this._manager.setCollapsed(false);
                        this._manager.acknowledgeIntro();
                  });
                  return;
            }

            this._el.innerHTML = `
                  <div class="guide-card">
                        ${!this._manager.introSeen ? `
                              <div class="guide-hero">
                                    <div class="guide-hero-kicker">首輪 15 分鐘導引</div>
                                    <div class="guide-hero-title">${this._escapeHtml(identity.playerName)} · ${this._escapeHtml(identity.roleLabel)}</div>
                                    <div class="guide-hero-text">先沿著主線完成新手閉環，再決定要掛機、抓蛋還是走融合線。</div>
                              </div>
                        ` : ''}
                        <div class="guide-head">
                              <div>
                                    <div class="guide-label">目前目標</div>
                                    <div class="guide-title">${this._escapeHtml(current?.title ?? '新手導引已完成')}</div>
                              </div>
                              <button class="guide-toggle-btn" type="button" aria-label="收合新手導引">收合</button>
                        </div>
                        <div class="guide-meta">
                              <span class="guide-meta-chip">${this._escapeHtml(identity.heroName)}</span>
                              <span class="guide-meta-chip">${this._escapeHtml(formatStarterPetSummary(identity.starterPetNames, 2))}</span>
                              <span class="guide-meta-chip">${progress.completed}/${progress.total}</span>
                        </div>
                        <div class="guide-current-copy">${this._escapeHtml(current?.description ?? identity.growthGoal)}</div>
                        <div class="guide-steps">
                              ${this._manager.steps.map((step) => `
                                    <div class="guide-step${step.done ? ' is-done' : step.active ? ' is-active' : ''}${step.locked ? ' is-locked' : ''}">
                                          <div class="guide-step-mark">${step.done ? 'OK' : step.active ? 'NOW' : '...'}</div>
                                          <div class="guide-step-copy">
                                                <div class="guide-step-title">${this._escapeHtml(step.title)}</div>
                                                <div class="guide-step-desc">${this._escapeHtml(step.description)}</div>
                                          </div>
                                    </div>
                              `).join('')}
                        </div>
                        <div class="guide-actions">
                              <button class="guide-secondary-btn" type="button">稍後再看</button>
                              <button class="guide-primary-btn" type="button">聚焦當前目標</button>
                        </div>
                  </div>
            `;

            this._el.querySelector('.guide-toggle-btn')?.addEventListener('click', () => {
                  this._manager.setCollapsed(true);
                  this._manager.acknowledgeIntro();
            });
            this._el.querySelector('.guide-secondary-btn')?.addEventListener('click', () => {
                  this._manager.setCollapsed(true);
                  this._manager.acknowledgeIntro();
            });
            this._el.querySelector('.guide-primary-btn')?.addEventListener('click', () => {
                  this._manager.acknowledgeIntro();
            });
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
            this._disposeListener?.();
            this._el.remove();
      }
}
