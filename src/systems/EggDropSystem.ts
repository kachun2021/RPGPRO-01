import { PET_DEFS } from '../pets/PetData';

export class EggDropSystem {
      private _container: HTMLDivElement;

      constructor() {
            this._container = document.createElement('div');
            this._container.id = 'egg-drop-layer';
            Object.assign(this._container.style, {
                  position: 'absolute', inset: '0',
                  pointerEvents: 'none', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  zIndex: '500',
            });
            document.getElementById('ui-layer')?.appendChild(this._container);
      }

      rollDrop(dropRate: number, eggPetId?: string): string | null {
            if (!eggPetId) return null;
            if (Math.random() > dropRate) return null;
            return eggPetId;
      }

      announce(playerName: string, petId: string): void {
            const petDef = PET_DEFS.find(p => p.id === petId);
            const petName = petDef?.nameCN ?? petId;

            const el = document.createElement('div');
            el.className = 'egg-announcement';
            el.textContent = 'Egg! ' + playerName + ' obtained ' + petName + ' egg!';

            this._container.appendChild(el);
            requestAnimationFrame(() => el.classList.add('show'));

            setTimeout(() => {
                  el.classList.remove('show');
                  setTimeout(() => el.remove(), 500);
            }, 4000);
      }

      dispose(): void {
            this._container.remove();
      }
}
