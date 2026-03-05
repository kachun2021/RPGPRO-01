import type { PetManager } from '../pets/PetManager';
import { SERIES_COLORS, SERIES_ICONS } from '../pets/PetData';

export class PetControlBar {
      private _container: HTMLDivElement;
      private _slots: HTMLDivElement[] = [];

      constructor() {
            this._container = document.createElement('div');
            this._container.id = 'petControlBar';
            this._container.className = 'pet-control-bar';

            for (let i = 0; i < 3; i++) {
                  const slot = document.createElement('div');
                  slot.className = 'pet-control-slot';

                  const hpArc = document.createElement('div');
                  hpArc.className = 'pet-hp-arc';
                  slot.appendChild(hpArc);

                  const icon = document.createElement('img');
                  icon.className = 'pet-control-icon';
                  icon.alt = 'pet';
                  slot.appendChild(icon);

                  this._slots.push(slot);
                  this._container.appendChild(slot);
            }

            document.getElementById('ui-layer')?.appendChild(this._container);
      }

      updateSlots(petManager: PetManager): void {
            for (let i = 0; i < 3; i++) {
                  const slot = this._slots[i];
                  const icon = slot.querySelector('img') as HTMLImageElement;
                  const hpArc = slot.querySelector('.pet-hp-arc') as HTMLDivElement;

                  if (i < petManager.active.length) {
                        const pet = petManager.active[i];
                        const color = SERIES_COLORS[pet.def.series];
                        const iconFile = SERIES_ICONS[pet.def.series];

                        slot.style.borderColor = `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},0.5)`;
                        icon.src = `assets/icons/${iconFile}`;
                        icon.style.opacity = '0.85';

                        const hpPct = (pet.stats.hp / pet.stats.maxHp) * 100;
                        const hpColor = hpPct > 50 ? 'rgba(46,204,113,0.5)' : hpPct > 25 ? 'rgba(241,196,15,0.5)' : 'rgba(231,76,60,0.5)';
                        hpArc.style.background = `conic-gradient(${hpColor} 0%, ${hpColor} ${hpPct}%, transparent ${hpPct}%)`;
                  } else {
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

