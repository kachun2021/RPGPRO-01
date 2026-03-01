type Channel = 'system' | 'world' | 'guild';

interface ChatMessage {
      channel: Channel;
      text: string;
      timestamp: number;
}

const CHANNEL_COLORS: Record<Channel, string> = {
      system: '#FFD700',
      world: '#AACCFF',
      guild: '#88FF88',
};

export class ChatBox {
      private _el: HTMLDivElement;
      private _msgList: HTMLDivElement;
      private _input: HTMLInputElement;
      private _messages: ChatMessage[] = [];
      private _currentChannel: Channel = 'system';
      private _collapsed = false;
      private _toggleBtn: HTMLDivElement;

      constructor() {
            this._el = document.createElement('div');
            this._el.id = 'chatBox';
            this._el.className = 'sa-frame sa-collapsible interactive';
            Object.assign(this._el.style, {
                  position: 'fixed', left: '8px', bottom: '56px',
                  width: '320px', zIndex: '150',
            });

            // Toggle button
            this._toggleBtn = document.createElement('div');
            this._toggleBtn.className = 'sa-toggle-btn';
            this._toggleBtn.textContent = '▼ Chat';
            this._toggleBtn.addEventListener('click', () => this._toggleCollapse());
            this._el.appendChild(this._toggleBtn);

            // Content wrapper
            const content = document.createElement('div');
            content.id = 'chatContent';

            // Channel tabs
            const tabs = document.createElement('div');
            tabs.className = 'sa-chat-tabs';
            for (const ch of ['system', 'world', 'guild'] as Channel[]) {
                  const tab = document.createElement('span');
                  tab.className = 'sa-chat-tab';
                  tab.textContent = ch.charAt(0).toUpperCase() + ch.slice(1);
                  tab.style.color = CHANNEL_COLORS[ch];
                  tab.addEventListener('click', () => {
                        this._currentChannel = ch;
                        this._render();
                  });
                  tabs.appendChild(tab);
            }
            content.appendChild(tabs);

            // Message list
            this._msgList = document.createElement('div');
            this._msgList.className = 'sa-chat-messages';
            content.appendChild(this._msgList);

            // Input row
            const inputRow = document.createElement('div');
            inputRow.className = 'sa-chat-input-row';
            this._input = document.createElement('input');
            this._input.className = 'sa-chat-input';
            this._input.placeholder = 'Type a message...';
            this._input.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter' && this._input.value.trim()) {
                        this.addMessage(this._currentChannel, this._input.value.trim());
                        this._input.value = '';
                  }
            });
            const sendBtn = document.createElement('button');
            sendBtn.className = 'sa-btn-sm';
            sendBtn.textContent = 'Send';
            sendBtn.addEventListener('click', () => {
                  if (this._input.value.trim()) {
                        this.addMessage(this._currentChannel, this._input.value.trim());
                        this._input.value = '';
                  }
            });
            inputRow.appendChild(this._input);
            inputRow.appendChild(sendBtn);
            content.appendChild(inputRow);

            this._el.appendChild(content);
            document.getElementById('ui-layer')?.appendChild(this._el);

            // Add some default system messages
            this.addMessage('system', 'Welcome to Fantasy Pet Online!');
            this.addMessage('system', 'Use WASD to move your character.');
      }

      addMessage(channel: Channel, text: string): void {
            this._messages.push({ channel, text, timestamp: Date.now() });
            if (this._messages.length > 50) this._messages.shift();
            this._render();
      }

      private _render(): void {
            const filtered = this._messages.filter(m => m.channel === this._currentChannel);
            this._msgList.innerHTML = filtered.map(m =>
                  `<div style="font-size:11px;color:${CHANNEL_COLORS[m.channel]};padding:2px 0">${m.text}</div>`
            ).join('');
            this._msgList.scrollTop = this._msgList.scrollHeight;
      }

      private _toggleCollapse(): void {
            this._collapsed = !this._collapsed;
            const content = this._el.querySelector('#chatContent') as HTMLElement;
            content.style.display = this._collapsed ? 'none' : '';
            this._toggleBtn.textContent = this._collapsed ? '▶ Chat' : '▼ Chat';
      }

      dispose(): void { this._el.remove(); }
}
