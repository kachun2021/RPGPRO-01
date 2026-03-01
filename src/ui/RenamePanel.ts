import type { Pet } from '../pets/Pet';

export class RenamePanel {
      private _el: HTMLDivElement;
      private _pet: Pet | null = null;
      private _onDone: (() => void) | null = null;

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'renamePanel';
            this._el.className = 'sa-panel';
            Object.assign(this._el.style, {
                  position: 'fixed', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)', width: '280px',
                  zIndex: '360', display: 'none',
            });
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      get element(): HTMLElement { return this._el; }

      openFor(pet: Pet, onDone?: () => void): void {
            this._pet = pet;
            this._onDone = onDone || null;
            this._el.style.display = '';
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

            // Title
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '<span>✏️ 寵物更名</span>';
            const closeBtn = document.createElement('span');
            closeBtn.style.cssText = 'cursor:pointer;font-size:14px;margin-left:auto';
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => this.close());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // Content
            const body = document.createElement('div');
            body.style.cssText = 'padding:12px 16px;display:flex;flex-direction:column;gap:10px';

            // Current name
            const curRow = document.createElement('div');
            curRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
            curRow.innerHTML = `
                  <span style="font-size:11px;color:rgba(200,195,185,0.6)">原名稱</span>
                  <span style="font-size:13px;color:rgba(232,201,106,0.9);font-weight:600">${pet.displayName}</span>
            `;
            body.appendChild(curRow);

            // New name input
            const inputRow = document.createElement('div');
            inputRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px';
            const label = document.createElement('span');
            label.style.cssText = 'font-size:11px;color:rgba(232,201,106,0.8);white-space:nowrap';
            label.textContent = '新名稱';
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 12;
            input.value = pet.displayName;
            input.className = 'dark-chat-input';
            input.style.cssText = 'flex:1;padding:6px 8px;font-size:13px;font-family:"Inter",sans-serif;outline:none';
            inputRow.appendChild(label);
            inputRow.appendChild(input);
            body.appendChild(inputRow);

            // Cost
            const costRow = document.createElement('div');
            costRow.style.cssText = 'text-align:center;font-size:11px;color:rgba(200,195,185,0.5)';
            costRow.textContent = '更改費用：500 GP';
            body.appendChild(costRow);

            // Buttons
            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex;gap:8px;justify-content:center;padding-top:4px';

            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-gold';
            confirmBtn.style.cssText = 'padding:6px 20px;font-size:12px';
            confirmBtn.textContent = '確 定';
            confirmBtn.addEventListener('click', () => {
                  const newName = input.value.trim();
                  if (newName && newName !== pet.displayName && pet) {
                        pet.nickname = newName;
                        console.log(`[Rename] ${pet.def.name} → ${newName}`);
                  }
                  this.close();
                  this._onDone?.();
            });

            const cancelBtn = document.createElement('button');
            cancelBtn.style.cssText = `
                  padding:6px 20px;font-size:12px;border-radius:6px;cursor:pointer;
                  background:rgba(160,130,80,0.12);border:1px solid rgba(160,130,80,0.25);
                  color:rgba(200,195,185,0.7);font-weight:600;font-family:'Inter',sans-serif;
            `;
            cancelBtn.textContent = '取 消';
            cancelBtn.addEventListener('click', () => this.close());

            btnRow.appendChild(confirmBtn);
            btnRow.appendChild(cancelBtn);
            body.appendChild(btnRow);

            this._el.appendChild(body);
      }

      dispose(): void { this._el.remove(); }
}
