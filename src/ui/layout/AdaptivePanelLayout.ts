export const ADAPTIVE_PANEL_CLASS = 'ui-panel-atlas';

function parseScale(el: HTMLElement): number {
      const raw = el.style.transform || '';
      const match = raw.match(/scale\(([\d.]+)\)/);
      if (!match) return 1;
      const value = Number(match[1]);
      return Number.isFinite(value) && value > 0 ? value : 1;
}

export function isAdaptivePanel(el: HTMLElement): boolean {
      return el.classList.contains(ADAPTIVE_PANEL_CLASS);
}

export function resetPanelTransform(el: HTMLElement): void {
      if (isAdaptivePanel(el)) {
            el.style.removeProperty('transform');
            el.style.removeProperty('transform-origin');
            return;
      }
      el.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');
}

export function installAdaptivePanelViewportFit(): () => void {
      let fitRaf = 0;

      const fitPanels = (): void => {
            const uiLayer = document.getElementById('ui-layer');
            if (!uiLayer) return;

            const vw = window.innerWidth || 0;
            const vh = window.innerHeight || 0;
            if (vw <= 0 || vh <= 0) return;

            const safeTop = 10;
            const safeBottom = Math.max(86, Math.floor(vh * 0.12));
            const safeSide = 10;
            const maxW = Math.max(260, vw - safeSide * 2);
            const maxH = Math.max(220, vh - safeTop - safeBottom);

            const panels = uiLayer.querySelectorAll<HTMLElement>(`.sa-panel:not(.${ADAPTIVE_PANEL_CLASS})`);
            panels.forEach((el) => {
                  const cs = window.getComputedStyle(el);
                  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;

                  const isPetPanel = el.id === 'petPanel';
                  const baseTransform = isPetPanel ? 'translateY(-50%)' : 'translate(-50%, -50%)';
                  const origin = isPetPanel ? 'right center' : 'center center';

                  const rect = el.getBoundingClientRect();
                  if (rect.width <= 0 || rect.height <= 0) return;

                  const currentScale = parseScale(el);
                  const naturalW = Math.max(el.scrollWidth, rect.width / currentScale);
                  const naturalH = Math.max(el.scrollHeight, rect.height / currentScale);
                  const nextScale = Math.max(0.5, Math.min(1, maxW / naturalW, maxH / naturalH));

                  const prevApplied = Number(el.dataset.fitScale || '1');
                  if (Math.abs(prevApplied - nextScale) < 0.01 && el.dataset.fitBase === baseTransform) return;

                  el.style.transformOrigin = origin;
                  el.style.setProperty('transform', `${baseTransform} scale(${nextScale.toFixed(3)})`, 'important');
                  el.dataset.fitBase = baseTransform;
                  el.dataset.fitScale = String(nextScale);
            });
      };

      const scheduleFit = (): void => {
            if (fitRaf) cancelAnimationFrame(fitRaf);
            fitRaf = requestAnimationFrame(() => {
                  fitRaf = 0;
                  fitPanels();
            });
      };

      window.addEventListener('resize', scheduleFit);
      window.addEventListener('orientationchange', scheduleFit);
      document.addEventListener('click', (evt) => {
            const target = evt.target as HTMLElement | null;
            if (!target) return;
            if (!target.closest('.sa-panel, .sa-nav-btn, .panel-close, .game-btn, .skill-tab-btn, .afk-menu-btn, .sa-tag')) return;
            scheduleFit();
      }, true);

      scheduleFit();
      return scheduleFit;
}
