export class PanelManager {
      private _panels = new Map<string, HTMLElement>();
      private _currentId: string | null = null;
      private _backdrop: HTMLElement;

      constructor() {
            this._backdrop = document.getElementById('panelBackdrop')!;
            this._backdrop.addEventListener('click', () => this.close());
      }

      register(id: string, element: HTMLElement): void {
            element.classList.add('panel');
            element.style.display = 'none';
            this._panels.set(id, element);
      }

      open(id: string): void {
            if (this._currentId === id) {
                  this.close();
                  return;
            }

            // Close any existing
            if (this._currentId) {
                  this._closePanel(this._currentId);
            }

            const el = this._panels.get(id);
            if (!el) return;

            el.style.display = '';
            el.classList.add('open');
            this._backdrop.classList.add('show');
            this._currentId = id;

            // Animate in
            requestAnimationFrame(() => {
                  el.style.transform = 'translate(-50%,-50%) scale(1)';
                  el.style.opacity = '1';
            });
      }

      close(): void {
            if (this._currentId) {
                  this._closePanel(this._currentId);
                  this._currentId = null;
            }
            this._backdrop.classList.remove('show');
      }

      toggle(id: string): void {
            if (this._currentId === id) {
                  this.close();
            } else {
                  this.open(id);
            }
      }

      get currentPanel(): string | null {
            return this._currentId;
      }

      private _closePanel(id: string): void {
            const el = this._panels.get(id);
            if (!el) return;
            el.style.transform = 'translate(-50%,-50%) scale(0.92)';
            el.style.opacity = '0';
            setTimeout(() => {
                  el.classList.remove('open');
                  el.style.display = 'none';
            }, 200);
      }

      dispose(): void {
            this._panels.clear();
      }
}
