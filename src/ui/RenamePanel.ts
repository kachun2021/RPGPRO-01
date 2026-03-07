import type { Pet } from '../pets/Pet';

export class RenamePanel {
      private _el: HTMLDivElement;
      private _pet: Pet | null = null;
      private _onDone: (() => void) | null = null;

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'renamePanel';
            this._el.className = 'sa-panel rename-root ui-panel-fullscreen';
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      get element(): HTMLElement {
            return this._el;
      }

      openFor(pet: Pet, onDone?: () => void): void {
            this._pet = pet;
            this._onDone = onDone || null;
            this._el.style.display = 'block';
            this._render();
      }

      close(): void {
            this._el.style.display = 'none';
            this._pet = null;
      }

      private _render(): void {
            const pet = this._pet;
            if (!pet) return;
            this._el.innerHTML = '';

            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '<span>✏️ 寵物更名</span>';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => this.close());
            title.appendChild(closeBtn);
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
            costRow.textContent = '更名費用：100 GP';
            body.appendChild(costRow);

            const btnRow = document.createElement('div');
            btnRow.className = 'rename-btn-row';

            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-gold rename-confirm-btn';
            confirmBtn.textContent = '確認';
            confirmBtn.addEventListener('click', () => {
                  const newName = input.value.trim();
                  if (newName && newName !== pet.displayName) {
                        pet.nickname = newName;
                  }
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
