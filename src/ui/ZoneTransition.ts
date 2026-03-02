/**
 * ZoneTransition — Full-screen loading overlay with zone name and progress bar.
 */
export class ZoneTransition {
      private _el: HTMLDivElement;
      private _nameEl: HTMLDivElement;
      private _fillEl: HTMLDivElement;

      constructor() {
            this._el = document.createElement('div');
            this._el.className = 'zone-transition';

            this._nameEl = document.createElement('div');
            this._nameEl.className = 'zone-transition-name';
            this._el.appendChild(this._nameEl);

            const bar = document.createElement('div');
            bar.className = 'zone-transition-bar';
            this._fillEl = document.createElement('div');
            this._fillEl.className = 'zone-transition-fill';
            bar.appendChild(this._fillEl);
            this._el.appendChild(bar);

            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      show(zoneName: string): void {
            this._nameEl.textContent = zoneName;
            this._fillEl.style.width = '0%';
            this._el.classList.add('show');
      }

      setProgress(pct: number): void {
            this._fillEl.style.width = `${Math.min(100, pct)}%`;
      }

      hide(): void {
            this._el.classList.remove('show');
      }

      dispose(): void {
            this._el.remove();
      }
}
