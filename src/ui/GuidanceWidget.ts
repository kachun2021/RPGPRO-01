import type { GuidanceState } from './GuidanceState';

export class GuidanceWidget {
      private readonly _el: HTMLDivElement;
      private readonly _source: HTMLSpanElement;
      private readonly _title: HTMLDivElement;
      private readonly _text: HTMLDivElement;
      private readonly _progress: HTMLSpanElement;
      private readonly _actionBtn: HTMLButtonElement;
      private _state: GuidanceState | null = null;
      private _onAction: ((state: GuidanceState) => void) | null = null;

      constructor() {
            this._el = document.createElement('div');
            this._el.className = 'guidance-root interactive';
            this._el.innerHTML = `
                  <div class="guidance-card">
                        <div class="guidance-head">
                              <span class="guidance-source"></span>
                              <span class="guidance-progress"></span>
                        </div>
                        <div class="guidance-title"></div>
                        <div class="guidance-text"></div>
                        <div class="guidance-actions">
                              <button type="button" class="guidance-primary-btn"></button>
                        </div>
                  </div>
            `;
            this._source = this._el.querySelector('.guidance-source') as HTMLSpanElement;
            this._title = this._el.querySelector('.guidance-title') as HTMLDivElement;
            this._text = this._el.querySelector('.guidance-text') as HTMLDivElement;
            this._progress = this._el.querySelector('.guidance-progress') as HTMLSpanElement;
            this._actionBtn = this._el.querySelector('.guidance-primary-btn') as HTMLButtonElement;
            this._actionBtn.addEventListener('click', () => {
                  if (!this._state) return;
                  this._onAction?.(this._state);
            });
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      setActionHandler(handler: ((state: GuidanceState) => void) | null): void {
            this._onAction = handler;
      }

      setState(state: GuidanceState): void {
            this._state = state;
            this._el.dataset.guidanceSource = state.source;
            this._source.textContent = this._sourceLabel(state.source);
            this._title.textContent = state.title;
            this._text.textContent = state.text;
            this._progress.textContent = state.progressLabel ?? '';
            this._progress.hidden = !state.progressLabel;
            if (state.action === 'none' || !state.actionLabel) {
                  this._actionBtn.hidden = true;
                  this._actionBtn.textContent = '';
            } else {
                  this._actionBtn.hidden = false;
                  this._actionBtn.textContent = state.actionLabel;
            }
      }

      dispose(): void {
            this._el.remove();
      }

      private _sourceLabel(source: GuidanceState['source']): string {
            switch (source) {
                  case 'onboarding': return '新手導引';
                  case 'main_quest': return '主線目標';
                  case 'growth': return '成長建議';
                  default: return '目前目標';
            }
      }
}
