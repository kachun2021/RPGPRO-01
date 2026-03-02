export type DamageType = 'normal' | 'crit' | 'counter' | 'resisted' | 'miss' | 'parry';

const COLORS: Record<DamageType, string> = {
      normal: '#ECE8E0',
      crit: '#E8C96A',
      counter: '#27AE60',
      resisted: '#E74C3C',
      miss: '#AAAAAA',
      parry: '#7BA4DB',
};

export class FloatingDamage {
      private _container: HTMLDivElement;

      constructor() {
            this._container = document.createElement('div');
            this._container.id = 'floating-damage-layer';
            Object.assign(this._container.style, {
                  position: 'absolute', inset: '0',
                  pointerEvents: 'none', overflow: 'hidden',
                  zIndex: '200',
            });
            document.getElementById('ui-layer')?.appendChild(this._container);
      }

      show(x: number, y: number, value: number | string, type: DamageType = 'normal'): void {
            const el = document.createElement('div');
            const isCrit = type === 'crit';
            const isText = type === 'miss' || type === 'parry';

            el.textContent = isText ? String(value) : String(Math.round(value as number));
            Object.assign(el.style, {
                  position: 'absolute',
                  left: x + '%',
                  top: y + '%',
                  color: COLORS[type],
                  fontFamily: "'Inter', sans-serif",
                  fontSize: isCrit ? '22px' : '16px',
                  fontWeight: isCrit ? '900' : '700',
                  textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  opacity: '1',
                  transition: 'all 0.8s ease-out',
                  zIndex: '201',
            });

            this._container.appendChild(el);

            requestAnimationFrame(() => {
                  el.style.top = (y - 8) + '%';
                  el.style.opacity = '0';
                  if (isCrit) el.style.transform = 'translate(-50%, -50%) scale(1.3)';
            });

            setTimeout(() => el.remove(), 900);
      }

      dispose(): void {
            this._container.remove();
      }
}
