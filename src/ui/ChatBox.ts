/**
 * ChatBox - dark theme, 3 channels.
 */
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

            const header = document.createElement('div');
            header.className = 'chatbox-header';
            header.textContent = '▼ Chat';
            this._el.appendChild(header);

            const body = document.createElement('div');
            body.className = 'chatbox-body';
            body.style.display = 'none';

            const tabs = document.createElement('div');
            tabs.className = 'chatbox-tabs';
            for (const ch of ['System', 'World', 'Guild']) {
                  const tab = document.createElement('span');
                  tab.className = `chatbox-tab${ch.toLowerCase() === this._channel ? ' is-active' : ''}`;
                  tab.textContent = ch;
                  tab.addEventListener('click', () => {
                        this._channel = ch.toLowerCase();
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
            this._input.placeholder = 'Type a message...';
            this._input.className = 'dark-chat-input';
            this._input.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter') this._send();
            });

            const sendBtn = document.createElement('div');
            sendBtn.className = 'dark-btn-sm';
            sendBtn.textContent = 'Send';
            sendBtn.addEventListener('click', () => this._send());

            inputRow.appendChild(this._input);
            inputRow.appendChild(sendBtn);
            body.appendChild(inputRow);
            this._el.appendChild(body);

            header.addEventListener('click', () => {
                  this._collapsed = !this._collapsed;
                  body.style.display = this._collapsed ? 'none' : '';
                  header.textContent = this._collapsed ? '▼ Chat' : '▲ Chat';
            });

            uiLayer.appendChild(this._el);

            this.addMessage('system', 'Welcome to Fantasy Pet Online!');
            this.addMessage('system', 'Use WASD to move your character');
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

