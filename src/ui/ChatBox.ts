/**
 * ChatBox — Dark premium theme, 3 channels
 */
export class ChatBox {
      private _el: HTMLDivElement;
      private _messages: HTMLDivElement;
      private _input: HTMLInputElement;
      private _channel = 'system';
      private _msgList: Array<{ ch: string; text: string }> = [];
      private _collapsed = true;  // Start collapsed to avoid blocking

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            this._el = document.createElement('div');
            this._el.id = 'chatBox';
            this._el.className = 'interactive';
            Object.assign(this._el.style, {
                  position: 'fixed', left: '10px', bottom: '44px', zIndex: '150',
                  width: '220px',
                  background: 'linear-gradient(180deg, rgba(20,16,30,0.88), rgba(12,10,20,0.92))',
                  border: '1px solid rgba(160,130,80,0.25)',
                  borderRadius: '6px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                  overflow: 'hidden',
            });

            // Toggle header
            const header = document.createElement('div');
            header.style.cssText = 'padding:3px 8px;cursor:pointer;font-size:10px;color:rgba(232,201,106,0.6);border-bottom:1px solid rgba(160,130,80,0.15)';
            header.textContent = '▶ Chat';
            header.addEventListener('click', () => {
                  this._collapsed = !this._collapsed;
                  body.style.display = this._collapsed ? 'none' : '';
                  header.textContent = this._collapsed ? '▶ Chat' : '▼ Chat';
            });
            this._el.appendChild(header);

            const body = document.createElement('div');
            body.style.display = 'none';  // Start collapsed

            // Channel tabs
            const tabs = document.createElement('div');
            tabs.style.cssText = 'display:flex;gap:10px;padding:3px 8px;border-bottom:1px solid rgba(160,130,80,0.12)';
            for (const ch of ['System', 'World', 'Guild']) {
                  const tab = document.createElement('span');
                  tab.style.cssText = `font-size:10px;font-weight:600;cursor:pointer;color:${ch.toLowerCase() === this._channel ? 'rgba(232,201,106,0.9)' : 'rgba(200,195,185,0.4)'}`;
                  tab.textContent = ch;
                  tab.addEventListener('click', () => {
                        this._channel = ch.toLowerCase();
                        tabs.querySelectorAll('span').forEach(s => (s as HTMLElement).style.color = 'rgba(200,195,185,0.4)');
                        tab.style.color = 'rgba(232,201,106,0.9)';
                        this._renderMessages();
                  });
                  tabs.appendChild(tab);
            }
            body.appendChild(tabs);

            // Messages
            this._messages = document.createElement('div');
            this._messages.style.cssText = 'height:60px;overflow-y:auto;padding:3px 8px;scrollbar-width:none';
            body.appendChild(this._messages);

            // Input row
            const inputRow = document.createElement('div');
            inputRow.style.cssText = 'display:flex;gap:4px;padding:3px 6px;border-top:1px solid rgba(160,130,80,0.12)';

            this._input = document.createElement('input');
            this._input.type = 'text';
            this._input.placeholder = 'Type a message...';
            this._input.className = 'dark-chat-input';

            const sendBtn = document.createElement('div');
            sendBtn.className = 'dark-btn-sm';
            sendBtn.textContent = 'Send';
            sendBtn.addEventListener('click', () => this._send());
            this._input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._send(); });

            inputRow.appendChild(this._input);
            inputRow.appendChild(sendBtn);
            body.appendChild(inputRow);

            this._el.appendChild(body);
            uiLayer.appendChild(this._el);

            // Initial messages
            this.addMessage('system', 'Welcome to Fantasy Pet Online!');
            this.addMessage('system', 'Use WASD to move your character');
      }

      addMessage(channel: string, text: string): void {
            this._msgList.push({ ch: channel, text });
            if (this._msgList.length > 50) this._msgList.shift();
            if (channel === this._channel) this._renderMessages();
      }

      private _renderMessages(): void {
            const filtered = this._msgList.filter(m => m.ch === this._channel);
            this._messages.innerHTML = filtered.map(m =>
                  `<div style="font-size:10px;color:rgba(220,215,200,0.7);padding:1px 0">${m.text}</div>`
            ).join('');
            this._messages.scrollTop = this._messages.scrollHeight;
      }

      private _send(): void {
            const text = this._input.value.trim();
            if (!text) return;
            this.addMessage(this._channel, text);
            this._input.value = '';
      }

      dispose(): void { this._el.remove(); }
}
