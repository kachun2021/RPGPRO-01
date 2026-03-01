import type { PetManager } from '../pets/PetManager';
import { SERIES_COLORS, SERIES_ICONS } from '../pets/PetData';

export class PetControlBar {
      private _container: HTMLDivElement;
      private _slots: HTMLDivElement[] = [];

      constructor() {
            this._container = document.createElement('div');
            this._container.id = 'petControlBar';
            Object.assign(this._container.style, {
                  position: 'fixed', right: '8px', top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                  zIndex: '200',
            });

            // Create 3 slots
            for (let i = 0; i < 3; i++) {
                  const slot = document.createElement('div');
                  Object.assign(slot.style, {
                        width: '42px', height: '42px', borderRadius: '10px',
                        background: 'rgba(15,20,40,0.7)',
                        border: '2px solid rgba(180,200,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                  });

                  // HP arc (conic-gradient overlay)
                  const hpArc = document.createElement('div');
                  hpArc.className = 'pet-hp-arc';
                  Object.assign(hpArc.style, {
                        position: 'absolute', inset: '-1px',
                        borderRadius: '10px',
                        background: 'conic-gradient(rgba(46,204,113,0.4) 0%, rgba(46,204,113,0.4) 100%, transparent 100%)',
                        pointerEvents: 'none',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))',
                  });
                  slot.appendChild(hpArc);

                  // Icon
                  const icon = document.createElement('img');
                  icon.style.width = '22px';
                  icon.style.height = '22px';
                  icon.style.objectFit = 'contain';
                  icon.style.opacity = '0.4';
                  icon.style.zIndex = '1';
                  icon.alt = 'pet';
                  slot.appendChild(icon);

                  this._slots.push(slot);
                  this._container.appendChild(slot);
            }

            document.getElementById('ui-layer')?.appendChild(this._container);
      }

      /** Update display from PetManager state */
      updateSlots(petManager: PetManager): void {
            for (let i = 0; i < 3; i++) {
                  const slot = this._slots[i];
                  const icon = slot.querySelector('img') as HTMLImageElement;
                  const hpArc = slot.querySelector('.pet-hp-arc') as HTMLDivElement;

                  if (i < petManager.active.length) {
                        const pet = petManager.active[i];
                        const color = SERIES_COLORS[pet.def.series];
                        const iconFile = SERIES_ICONS[pet.def.series];

                        // Series color border
                        slot.style.borderColor = `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},0.5)`;

                        // Icon
                        icon.src = `assets/icons/${iconFile}`;
                        icon.style.opacity = '0.85';

                        // HP arc
                        const hpPct = (pet.stats.hp / pet.stats.maxHp) * 100;
                        const hpColor = hpPct > 50 ? 'rgba(46,204,113,0.5)' : hpPct > 25 ? 'rgba(241,196,15,0.5)' : 'rgba(231,76,60,0.5)';
                        hpArc.style.background = `conic-gradient(${hpColor} 0%, ${hpColor} ${hpPct}%, transparent ${hpPct}%)`;
                  } else {
                        // Empty slot
                        slot.style.borderColor = 'rgba(180,200,255,0.08)';
                        icon.src = '';
                        icon.style.opacity = '0.2';
                        hpArc.style.background = 'none';
                  }
            }
      }

      dispose(): void {
            this._container.remove();
      }
}
