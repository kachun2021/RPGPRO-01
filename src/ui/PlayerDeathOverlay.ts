export interface PlayerDeathOverlayActions {
      onReviveHere: () => void;
      onReturnTown: () => void;
      onStop: () => void;
}

export class PlayerDeathOverlay {
      private _el: HTMLDivElement;
      private _card: HTMLDivElement;
      private _banner: HTMLDivElement;

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'player-death-overlay';
            this._el.className = 'player-death-root';
            this._el.hidden = true;

            this._card = document.createElement('div');
            this._card.className = 'player-death-card';
            this._el.appendChild(this._card);

            this._banner = document.createElement('div');
            this._banner.className = 'player-revive-banner';
            this._banner.hidden = true;

            const uiLayer = document.getElementById('ui-layer');
            uiLayer?.appendChild(this._el);
            uiLayer?.appendChild(this._banner);
      }

      showDown(monsterName: string | null, actions: PlayerDeathOverlayActions): void {
            const source = monsterName ? `${monsterName} 擊倒了你` : '你已倒下';
            this._el.hidden = false;
            this._card.innerHTML = `
                  <div class="player-death-title">戰鬥失敗</div>
                  <div class="player-death-sub">${source}</div>
                  <div class="player-death-note">選擇復活方式。原地復活保留戰場位置，回城則回到最近城鎮安全區。</div>
                  <div class="player-death-actions">
                        <button type="button" class="player-death-btn player-death-btn-primary" data-action="field">原地復活</button>
                        <button type="button" class="player-death-btn" data-action="town">回城復活</button>
                        <button type="button" class="player-death-btn player-death-btn-ghost" data-action="stop">停止掛機</button>
                  </div>
            `;
            this._card.querySelector<HTMLButtonElement>('[data-action="field"]')?.addEventListener('click', actions.onReviveHere);
            this._card.querySelector<HTMLButtonElement>('[data-action="town"]')?.addEventListener('click', actions.onReturnTown);
            this._card.querySelector<HTMLButtonElement>('[data-action="stop"]')?.addEventListener('click', actions.onStop);
      }

      showPending(message: string): void {
            this._el.hidden = false;
            this._card.innerHTML = `
                  <div class="player-death-title">復活中</div>
                  <div class="player-death-sub">${message}</div>
                  <div class="player-death-note">請稍候，系統正在重置角色狀態與安全位置。</div>
            `;
      }

      hide(): void {
            this._el.hidden = true;
            this._card.innerHTML = '';
      }

      showReviveBanner(message: string): void {
            this._banner.textContent = message;
            this._banner.hidden = false;
            this._banner.classList.remove('show');
            requestAnimationFrame(() => this._banner.classList.add('show'));
            window.setTimeout(() => {
                  this._banner.classList.remove('show');
                  window.setTimeout(() => {
                        this._banner.hidden = true;
                  }, 250);
            }, 2400);
      }

      dispose(): void {
            this._el.remove();
            this._banner.remove();
      }
}
