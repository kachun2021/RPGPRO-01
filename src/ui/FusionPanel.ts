import type { PetManager } from '../pets/PetManager';
import { PetFusion } from '../pets/PetFusion';
import { PET_DEFS, SERIES_ICONS } from '../pets/PetData';

export class FusionPanel {
      private _el: HTMLDivElement;
      private _slot1Idx = -1;
      private _slot2Idx = -1;
      private _petManager: PetManager;
      private _rateEl!: HTMLSpanElement;
      private _slot1El!: HTMLDivElement;
      private _slot2El!: HTMLDivElement;
      private _resultEl!: HTMLDivElement;
      private _fuseBtn!: HTMLButtonElement;

      constructor(petManager: PetManager) {
            this._petManager = petManager;

            this._el = document.createElement('div');
            this._el.id = 'fusionPanel';
            this._el.className = 'panel';
            Object.assign(this._el.style, { width: '340px', minHeight: '280px' });

            // Header
            const header = document.createElement('div');
            header.style.cssText = 'text-align:center;margin-bottom:16px';
            header.innerHTML = `<span style="font-family:'Cinzel',serif;font-size:16px;color:#E8C96A">🔮 Pet Fusion</span>`;
            this._el.appendChild(header);

            // Fusion slots layout
            const slotsRow = document.createElement('div');
            slotsRow.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px';

            this._slot1El = this._createSlot('Primary');
            this._slot2El = this._createSlot('Secondary');
            this._resultEl = this._createSlot('Result');
            this._resultEl.style.borderColor = 'rgba(232,201,106,0.3)';

            const arrow = document.createElement('div');
            arrow.style.cssText = 'font-size:20px;color:rgba(232,201,106,0.5)';
            arrow.textContent = '→';

            const plus = document.createElement('div');
            plus.style.cssText = 'font-size:16px;color:rgba(200,195,185,0.3)';
            plus.textContent = '+';

            slotsRow.appendChild(this._slot1El);
            slotsRow.appendChild(plus);
            slotsRow.appendChild(this._slot2El);
            slotsRow.appendChild(arrow);
            slotsRow.appendChild(this._resultEl);
            this._el.appendChild(slotsRow);

            // Rate display
            const rateRow = document.createElement('div');
            rateRow.style.cssText = 'text-align:center;margin-bottom:12px';
            this._rateEl = document.createElement('span');
            this._rateEl.style.cssText = 'font-size:13px;color:#E8C96A';
            this._rateEl.textContent = 'Select two pets';
            rateRow.appendChild(this._rateEl);
            this._el.appendChild(rateRow);

            // Pet selection list
            const list = document.createElement('div');
            list.id = 'fusionPetList';
            list.style.cssText = 'max-height:120px;overflow-y:auto;display:flex;flex-direction:column;gap:3px;margin-bottom:12px';
            this._el.appendChild(list);

            // Fuse button
            this._fuseBtn = document.createElement('button');
            this._fuseBtn.className = 'btn-gold';
            this._fuseBtn.style.cssText = 'width:100%;opacity:0.4;pointer-events:none';
            this._fuseBtn.textContent = '🔮 Fuse';
            this._fuseBtn.addEventListener('click', () => this._executeFusion());
            this._el.appendChild(this._fuseBtn);

            document.getElementById('ui-layer')?.appendChild(this._el);
            this._renderPetList();
      }

      get element(): HTMLElement { return this._el; }

      private _createSlot(label: string): HTMLDivElement {
            const slot = document.createElement('div');
            slot.style.cssText = `width:60px;height:60px;border-radius:12px;
      background:rgba(15,20,40,0.6);border:2px solid rgba(180,200,255,0.1);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      font-size:10px;color:rgba(200,195,185,0.3)`;
            slot.innerHTML = `<span style="font-size:18px">?</span><span>${label}</span>`;
            return slot;
      }

      private _renderPetList(): void {
            const list = this._el.querySelector('#fusionPetList')!;
            list.innerHTML = '';

            for (let i = 0; i < this._petManager.owned.length; i++) {
                  const pet = this._petManager.owned[i];
                  const isSelected = i === this._slot1Idx || i === this._slot2Idx;

                  const row = document.createElement('div');
                  row.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;
        background:${isSelected ? 'rgba(232,201,106,0.08)' : 'rgba(255,255,255,0.02)'};
        border:1px solid ${isSelected ? 'rgba(232,201,106,0.2)' : 'rgba(180,200,255,0.05)'};
        transition:all 0.12s`;
                  row.innerHTML = `
        <img src="assets/icons/${SERIES_ICONS[pet.def.series]}" style="width:20px;height:20px" alt="">
        <span style="font-size:12px;color:#ECE8E0;flex:1">${pet.def.name}</span>
        <span style="font-size:10px;color:rgba(200,195,185,0.5)">Lv.${pet.stats.level}</span>
      `;
                  row.addEventListener('click', () => this._selectPet(i));
                  list.appendChild(row);
            }
      }

      private _selectPet(idx: number): void {
            if (this._slot1Idx === -1 || this._slot1Idx === idx) {
                  this._slot1Idx = this._slot1Idx === idx ? -1 : idx;
            } else if (this._slot2Idx === -1 || this._slot2Idx === idx) {
                  this._slot2Idx = this._slot2Idx === idx ? -1 : idx;
            } else {
                  this._slot2Idx = idx;
            }
            this._updateDisplay();
      }

      private _updateDisplay(): void {
            this._renderPetList();

            // Update slots
            this._updateSlotEl(this._slot1El, this._slot1Idx, 'Primary');
            this._updateSlotEl(this._slot2El, this._slot2Idx, 'Secondary');

            // Check recipe
            if (this._slot1Idx >= 0 && this._slot2Idx >= 0) {
                  const p1 = this._petManager.owned[this._slot1Idx];
                  const p2 = this._petManager.owned[this._slot2Idx];
                  const recipe = PetFusion.findRecipe(p1, p2);

                  if (recipe) {
                        const rate = PetFusion.getSuccessRate(p1, p2, recipe);
                        const resultDef = PET_DEFS.find(d => d.id === recipe.resultId);
                        this._rateEl.textContent = `Success: ${rate}% → ${resultDef?.name || recipe.resultId}`;
                        this._rateEl.style.color = rate >= 70 ? '#2ECC71' : rate >= 40 ? '#E8C96A' : '#E74C3C';
                        this._resultEl.innerHTML = `<img src="assets/icons/${SERIES_ICONS[resultDef?.series || p1.def.series]}" style="width:24px;height:24px" alt="">
          <span style="font-size:9px">${resultDef?.name || '?'}</span>`;
                        this._fuseBtn.style.opacity = '1';
                        this._fuseBtn.style.pointerEvents = 'auto';
                  } else {
                        this._rateEl.textContent = 'No matching recipe';
                        this._rateEl.style.color = 'rgba(200,195,185,0.4)';
                        this._resultEl.innerHTML = `<span style="font-size:18px">?</span><span>Result</span>`;
                        this._fuseBtn.style.opacity = '0.4';
                        this._fuseBtn.style.pointerEvents = 'none';
                  }
            } else {
                  this._rateEl.textContent = 'Select two pets';
                  this._rateEl.style.color = '#E8C96A';
                  this._resultEl.innerHTML = `<span style="font-size:18px">?</span><span>Result</span>`;
                  this._fuseBtn.style.opacity = '0.4';
                  this._fuseBtn.style.pointerEvents = 'none';
            }
      }

      private _updateSlotEl(el: HTMLDivElement, idx: number, label: string): void {
            if (idx >= 0 && idx < this._petManager.owned.length) {
                  const pet = this._petManager.owned[idx];
                  el.innerHTML = `<img src="assets/icons/${SERIES_ICONS[pet.def.series]}" style="width:24px;height:24px" alt="">
        <span style="font-size:9px">${pet.def.name}</span>`;
            } else {
                  el.innerHTML = `<span style="font-size:18px">?</span><span>${label}</span>`;
            }
      }

      private _executeFusion(): void {
            if (this._slot1Idx < 0 || this._slot2Idx < 0) return;
            if (this._slot1Idx === this._slot2Idx) return;

            const p1 = this._petManager.owned[this._slot1Idx];
            const p2 = this._petManager.owned[this._slot2Idx];
            const recipe = PetFusion.findRecipe(p1, p2);
            if (!recipe) return;

            const result = PetFusion.fuse(p1, p2, recipe, false);

            // Helper: safely remove a pet from owned (recall if active first)
            const removePet = (idx: number) => {
                  const pet = this._petManager.owned[idx];
                  if (pet.isActive) {
                        const activeIdx = this._petManager.active.indexOf(pet);
                        if (activeIdx >= 0) this._petManager.recall(activeIdx);
                  }
                  pet.dispose();
                  this._petManager.owned.splice(idx, 1);
            };

            if (result.success) {
                  // Success animation
                  this._el.style.boxShadow = '0 0 40px rgba(232,201,106,0.5)';
                  this._rateEl.textContent = `✨ Success! ${PET_DEFS.find(d => d.id === result.resultId)?.name} Lv.${result.newLevel}`;
                  this._rateEl.style.color = '#2ECC71';

                  // Add new pet
                  if (result.resultId) {
                        this._petManager.addPet(result.resultId, p2.gender);
                  }

                  // Remove secondary (always slot2), handle index shift
                  // If slot2 > slot1, remove slot2 first (no shift needed for slot1)
                  // If slot2 < slot1, removing slot2 shifts slot1 down by 1
                  removePet(this._slot2Idx);

                  setTimeout(() => { this._el.style.boxShadow = ''; }, 1500);
            } else {
                  // Failure animation
                  this._el.style.animation = 'shake 0.3s';
                  this._el.style.boxShadow = '0 0 30px rgba(231,76,60,0.4)';
                  this._rateEl.textContent = `💥 Failed! ${p1.def.name} -${result.primaryLevelDrop} levels`;
                  this._rateEl.style.color = '#E74C3C';

                  // Remove secondary (consumed on fail)
                  removePet(this._slot2Idx);

                  setTimeout(() => {
                        this._el.style.animation = '';
                        this._el.style.boxShadow = '';
                  }, 1500);
            }

            this._slot1Idx = -1;
            this._slot2Idx = -1;
            setTimeout(() => this._updateDisplay(), 500);
      }

      refresh(): void {
            this._slot1Idx = -1;
            this._slot2Idx = -1;
            this._updateDisplay();
      }

      dispose(): void {
            this._el.remove();
      }
}
