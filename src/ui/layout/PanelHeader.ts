import { renderUiIcon, type UiIconId } from '../UiIconCatalog';

export interface PanelHeaderOptions {
      icon: UiIconId;
      kicker?: string;
      title: string;
      subtitle: string;
      summaryText?: string;
      summaryClassName?: string;
      closeLabel: string;
      closeId?: string;
      closeText?: string;
      onClose: () => void;
}

export interface PanelHeaderParts {
      root: HTMLDivElement;
      summaryEl: HTMLSpanElement | null;
      closeBtn: HTMLButtonElement;
}

export function createPanelHeader(options: PanelHeaderOptions): PanelHeaderParts {
      const root = document.createElement('div');
      root.className = 'sa-panel-title';

      const copy = document.createElement('div');
      copy.className = 'atlas-title-copy';

      if (options.kicker) {
            const kicker = document.createElement('span');
            kicker.className = 'atlas-kicker';
            kicker.textContent = options.kicker;
            copy.appendChild(kicker);
      }

      const title = document.createElement('span');
      title.className = 'atlas-title-main';
      title.innerHTML = renderUiIcon(options.icon, 'atlas-title-icon');
      const titleText = document.createElement('span');
      titleText.textContent = options.title;
      title.appendChild(titleText);
      copy.appendChild(title);

      const subtitle = document.createElement('span');
      subtitle.className = 'atlas-title-meta';
      subtitle.textContent = options.subtitle;
      copy.appendChild(subtitle);

      root.appendChild(copy);

      let summaryEl: HTMLSpanElement | null = null;
      if (options.summaryText !== undefined) {
            summaryEl = document.createElement('span');
            summaryEl.className = ['atlas-header-pill', options.summaryClassName].filter(Boolean).join(' ');
            summaryEl.textContent = options.summaryText;
            root.appendChild(summaryEl);
      }

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'panel-close';
      closeBtn.textContent = options.closeText ?? '×';
      closeBtn.setAttribute('aria-label', options.closeLabel);
      if (options.closeId) closeBtn.id = options.closeId;
      closeBtn.addEventListener('click', options.onClose);
      root.appendChild(closeBtn);

      return { root, summaryEl, closeBtn };
}
