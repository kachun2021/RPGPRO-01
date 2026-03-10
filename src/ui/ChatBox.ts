export class ChatBox {
      private _el: HTMLDivElement;
      private _messages: HTMLDivElement;
      private _input: HTMLInputElement;
      private _channel = 'system';
      private _msgList: Array<{ ch: string; text: string }> = [];
      private _collapsed = true;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            this._el = document.createElement('div');
            this._el.id = 'chatBox';
            this._el.className = 'interactive chatbox-root';
            this._el.dataset.chromeGroup = 'utility';

            const header = document.createElement('div');
            header.className = 'chatbox-header';
            header.innerHTML = `
                  <span class="chatbox-header-kicker">通訊</span>
                  <span class="chatbox-header-title">隊伍頻道</span>
                  <span class="chatbox-header-toggle">收合</span>
            `;
            this._el.appendChild(header);

            const body = document.createElement('div');
            body.className = 'chatbox-body';

            const tabs = document.createElement('div');
            tabs.className = 'chatbox-tabs';
            const channelLabels: Array<{ id: string; label: string }> = [
                  { id: 'system', label: '系統' },
                  { id: 'world', label: '世界' },
                  { id: 'guild', label: '公會' },
            ];
            for (const ch of channelLabels) {
                  const tab = document.createElement('span');
                  tab.className = `chatbox-tab${ch.id === this._channel ? ' is-active' : ''}`;
                  tab.textContent = ch.label;
                  tab.addEventListener('click', () => {
                        this._channel = ch.id;
                        tabs.querySelectorAll('.chatbox-tab').forEach((s) => s.classList.remove('is-active'));
                        tab.classList.add('is-active');
                        this._renderMessages();
                  });
                  tabs.appendChild(tab);
            }
            body.appendChild(tabs);

            this._messages = document.createElement('div');
            this._messages.className = 'chatbox-messages';
            body.appendChild(this._messages);

            const inputRow = document.createElement('div');
            inputRow.className = 'chatbox-input-row';

            this._input = document.createElement('input');
            this._input.type = 'text';
            this._input.placeholder = '輸入訊息...';
            this._input.className = 'dark-chat-input';
            this._input.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter') this._send();
            });

            const sendBtn = document.createElement('button');
            sendBtn.type = 'button';
            sendBtn.className = 'dark-btn-sm';
            sendBtn.textContent = '送出';
            sendBtn.addEventListener('click', () => this._send());

            inputRow.appendChild(this._input);
            inputRow.appendChild(sendBtn);
            body.appendChild(inputRow);
            this._el.appendChild(body);

            header.addEventListener('click', () => {
                  this._collapsed = !this._collapsed;
                  this._el.classList.toggle('is-collapsed', this._collapsed);
                  const title = header.querySelector('.chatbox-header-title') as HTMLSpanElement | null;
                  const toggle = header.querySelector('.chatbox-header-toggle') as HTMLSpanElement | null;
                  if (title) title.textContent = this._collapsed ? '隊伍頻道' : '頻道視窗';
                  if (toggle) toggle.textContent = this._collapsed ? '展開' : '收合';
            });

            uiLayer.appendChild(this._el);
            this._el.classList.add('is-collapsed');

            this.addMessage('system', '歡迎來到 Fantasy Pet Online。');
            this.addMessage('system', '手機橫向建議使用左側搖桿與右側技能列。');
      }

      addMessage(channel: string, text: string): void {
            this._msgList.push({ ch: channel, text });
            if (this._msgList.length > 50) this._msgList.shift();
            if (channel === this._channel) this._renderMessages();
      }

      private _renderMessages(): void {
            const filtered = this._msgList.filter((m) => m.ch === this._channel);
            this._messages.innerHTML = filtered
                  .map((m) => `<div class="chatbox-message">${m.text}</div>`)
                  .join('');
            this._messages.scrollTop = this._messages.scrollHeight;
      }

      private _send(): void {
            const text = this._input.value.trim();
            if (!text) return;
            this.addMessage(this._channel, text);
            this._input.value = '';
      }

      dispose(): void {
            this._el.remove();
      }
}
