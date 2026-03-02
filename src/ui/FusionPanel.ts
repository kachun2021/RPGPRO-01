import type { PetManager } from '../pets/PetManager';
import { PetFusion } from '../pets/PetFusion';
import type { FusionMatch } from '../pets/PetFusion';
import { PET_DEFS, SERIES_EMOJI } from '../pets/PetData';
import type { Pet } from '../pets/Pet';

/**
 * FusionPanel — Mix Master-style center popup fusion machine.
 * Opaque dark premium panel with gold accents.
 */
export class FusionPanel {
      private _el: HTMLDivElement;
      private _backdrop: HTMLDivElement;
      private _petManager: PetManager;
      private _mainPet: Pet | null = null;
      private _subPet: Pet | null = null;
      private _hasProtection = false;
      private _selectingSlot: 'main' | 'sub' | null = null;
      private _onClose: (() => void) | null = null;

      constructor(petManager: PetManager) {
            this._petManager = petManager;

            // ── OWN BACKDROP ──
            this._backdrop = document.createElement('div');
            Object.assign(this._backdrop.style, {
                  position: 'fixed', inset: '0',
                  background: 'rgba(0,0,0,0.5)',
                  zIndex: '399', display: 'none',
                  transition: 'opacity 0.2s',
                  opacity: '0',
            });
            this._backdrop.addEventListener('click', () => this.close());
            document.getElementById('ui-layer')?.appendChild(this._backdrop);

            this._el = document.createElement('div');
            this._el.id = 'fusionPanel';
            Object.assign(this._el.style, {
                  position: 'fixed',
                  left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%) scale(0.92)',
                  width: '360px',
                  maxHeight: '85vh',
                  zIndex: '400',
                  display: 'none',
                  opacity: '0',
                  transition: 'transform 0.25s ease-out, opacity 0.25s ease-out',
                  overflow: 'auto',
                  // ── OPAQUE SOLID BACKGROUND ──
                  background: 'linear-gradient(180deg, #2A2040 0%, #1A1530 40%, #12101E 100%)',
                  border: '2px solid rgba(160,130,80,0.5)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(160,130,80,0.1)',
                  pointerEvents: 'auto',
            });
            // Prevent ANY click inside panel from propagating to backdrop or other layers
            this._el.addEventListener('click', (e) => e.stopPropagation());
            this._el.addEventListener('mousedown', (e) => e.stopPropagation());
            document.getElementById('ui-layer')?.appendChild(this._el);
      }

      get element(): HTMLElement { return this._el; }

      open(onClose?: () => void): void {
            this._onClose = onClose || null;
            this._mainPet = null;
            this._subPet = null;
            this._hasProtection = false;
            this._selectingSlot = null;
            // Show backdrop
            this._backdrop.style.display = '';
            requestAnimationFrame(() => { this._backdrop.style.opacity = '1'; });
            // Show panel
            this._el.style.display = '';
            requestAnimationFrame(() => {
                  this._el.style.transform = 'translate(-50%, -50%) scale(1)';
                  this._el.style.opacity = '1';
            });
            this._render();
      }

      close(): void {
            this._el.style.transform = 'translate(-50%, -50%) scale(0.92)';
            this._el.style.opacity = '0';
            this._backdrop.style.opacity = '0';
            setTimeout(() => {
                  this._el.style.display = 'none';
                  this._backdrop.style.display = 'none';
            }, 200);
            this._onClose?.();
      }

      refresh(): void {
            this._mainPet = null;
            this._subPet = null;
            this._hasProtection = false;
            this._selectingSlot = null;
            if (this._el.style.display !== 'none') this._render();
      }

      private _render(): void {
            this._el.innerHTML = '';

            // ── TITLE BAR ──
            const titleBar = document.createElement('div');
            Object.assign(titleBar.style, {
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 14px',
                  background: 'linear-gradient(180deg, #352850 0%, #2A2040 100%)',
                  borderBottom: '2px solid rgba(160,130,80,0.4)',
                  borderRadius: '6px 6px 0 0',
            });
            const titleText = document.createElement('span');
            titleText.textContent = '⚗️ 合成';
            Object.assign(titleText.style, {
                  fontFamily: "'Cinzel', serif",
                  fontSize: '15px', fontWeight: '700',
                  color: '#E8C96A',
                  textShadow: '0 0 8px rgba(232,201,106,0.3)',
            });

            const closeBtn = document.createElement('span');
            closeBtn.textContent = '✕';
            Object.assign(closeBtn.style, {
                  marginLeft: 'auto', cursor: 'pointer', fontSize: '14px',
                  color: 'rgba(200,195,185,0.6)', padding: '2px 6px',
                  borderRadius: '3px', transition: 'all 0.15s',
            });
            closeBtn.addEventListener('mouseenter', () => { closeBtn.style.color = '#E74C3C'; closeBtn.style.background = 'rgba(231,76,60,0.15)'; });
            closeBtn.addEventListener('mouseleave', () => { closeBtn.style.color = 'rgba(200,195,185,0.6)'; closeBtn.style.background = ''; });
            closeBtn.addEventListener('click', () => this.close());

            titleBar.appendChild(titleText);
            titleBar.appendChild(closeBtn);
            this._el.appendChild(titleBar);

            // ── MACHINE AREA ──
            const machineArea = document.createElement('div');
            Object.assign(machineArea.style, {
                  padding: '16px 14px',
                  background: 'radial-gradient(ellipse at center, rgba(60,45,80,0.3) 0%, transparent 70%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            });

            // Machine label
            const machineLabel = document.createElement('div');
            Object.assign(machineLabel.style, {
                  fontFamily: "'Cinzel', serif", fontSize: '14px',
                  color: 'rgba(232,201,106,0.7)', textAlign: 'center',
                  letterSpacing: '2px',
            });
            machineLabel.textContent = '🔬 合成機';
            machineArea.appendChild(machineLabel);

            // ── TWO PET SLOTS ──
            const slotsRow = document.createElement('div');
            Object.assign(slotsRow.style, {
                  display: 'flex', alignItems: 'center', gap: '14px', margin: '6px 0',
            });

            const mainSlotWrap = this._createPetSlot('主寵 (Main)', this._mainPet, 'main');
            const plusSign = document.createElement('div');
            Object.assign(plusSign.style, {
                  fontSize: '28px', fontWeight: '700',
                  color: 'rgba(232,201,106,0.5)',
                  textShadow: '0 0 12px rgba(232,201,106,0.2)',
            });
            plusSign.textContent = '+';
            const subSlotWrap = this._createPetSlot('副寵 (Sub)', this._subPet, 'sub');

            slotsRow.appendChild(mainSlotWrap);
            slotsRow.appendChild(plusSign);
            slotsRow.appendChild(subSlotWrap);
            machineArea.appendChild(slotsRow);

            // ── RESULT PREVIEW BOX ──
            const resultBox = document.createElement('div');
            Object.assign(resultBox.style, {
                  width: '100%', padding: '10px 12px', borderRadius: '6px',
                  textAlign: 'center',
                  background: 'rgba(15,12,22,0.8)',
                  border: '1px solid rgba(160,130,80,0.25)',
                  minHeight: '55px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
            });

            if (this._mainPet && this._subPet) {
                  const matches = PetFusion.findRecipes(this._mainPet, this._subPet);
                  if (matches.length > 0) {
                        const match = matches[0];
                        const rate = PetFusion.getSuccessRate(this._mainPet, this._subPet, match.resultDef);
                        const emoji = SERIES_EMOJI[match.resultDef.series] || '🐾';
                        const rateColor = rate >= 60 ? '#27AE60' : rate >= 30 ? '#F39C12' : '#E74C3C';

                        resultBox.innerHTML = `
                              <div style="font-size:10px;color:rgba(200,195,185,0.5);margin-bottom:3px;letter-spacing:1px">成功率</div>
                              <div style="font-size:26px;font-weight:700;color:${rateColor};text-shadow:0 0 12px ${rateColor}40">${rate}%</div>
                              <div style="margin-top:8px;display:flex;align-items:center;gap:8px;
                                    background:rgba(160,130,80,0.08);padding:6px 12px;border-radius:4px;
                                    border:1px solid rgba(160,130,80,0.15)">
                                    <span style="font-size:24px">${emoji}</span>
                                    <div style="text-align:left">
                                          <div style="font-size:13px;color:#E8C96A;font-weight:700">${match.resultDef.nameCN}</div>
                                          <div style="font-size:10px;color:rgba(200,195,185,0.5)">${match.resultDef.name} · Lv.${match.resultDef.baseLevel}</div>
                                    </div>
                              </div>
                              ${matches.length > 1 ? `<div style="font-size:9px;color:rgba(200,195,185,0.4);margin-top:4px">另有 ${matches.length - 1} 種組合</div>` : ''}
                        `;
                  } else {
                        resultBox.innerHTML = `
                              <div style="font-size:13px;color:#E74C3C;font-weight:700">❌ 無法進行合成</div>
                              <div style="font-size:10px;color:rgba(200,195,185,0.4);margin-top:3px">請嘗試另一種組合</div>
                        `;
                  }
            } else {
                  resultBox.innerHTML = `
                        <div style="font-size:11px;color:rgba(200,195,185,0.35);letter-spacing:1px">合成級別：？</div>
                        <div style="font-size:10px;color:rgba(200,195,185,0.25);margin-top:3px">選擇兩隻寵物進行合成</div>
                  `;
            }
            machineArea.appendChild(resultBox);

            // ── PROTECTION TOGGLE ──
            const protRow = document.createElement('div');
            Object.assign(protRow.style, {
                  display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px',
                  padding: '4px 8px', borderRadius: '4px',
                  background: 'rgba(160,130,80,0.06)',
                  border: '1px solid rgba(160,130,80,0.12)',
            });

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this._hasProtection;
            Object.assign(checkbox.style, { accentColor: '#E8C96A', cursor: 'pointer' });
            checkbox.addEventListener('change', () => { this._hasProtection = checkbox.checked; });

            const protLabel = document.createElement('span');
            Object.assign(protLabel.style, { fontSize: '10px', color: 'rgba(200,195,185,0.6)' });
            protLabel.textContent = '🛡️ 合成用物品 (保護石)';

            protRow.appendChild(checkbox);
            protRow.appendChild(protLabel);
            machineArea.appendChild(protRow);

            this._el.appendChild(machineArea);

            // ── PET SELECTION LIST ──
            if (this._selectingSlot) {
                  const listSec = document.createElement('div');
                  Object.assign(listSec.style, {
                        padding: '8px 10px', maxHeight: '180px', overflowY: 'auto',
                        borderTop: '1px solid rgba(160,130,80,0.2)',
                        background: 'rgba(12,10,18,0.5)',
                  });

                  const listTitle = document.createElement('div');
                  Object.assign(listTitle.style, {
                        fontSize: '11px', color: '#E8C96A', marginBottom: '6px',
                        fontWeight: '700', letterSpacing: '1px',
                  });
                  listTitle.textContent = this._selectingSlot === 'main' ? '▼ 選擇主寵' : '▼ 選擇副寵';
                  listSec.appendChild(listTitle);

                  const inactive = this._petManager.owned.filter(p => !p.isActive && !p.isDead);
                  if (inactive.length === 0) {
                        const empty = document.createElement('div');
                        Object.assign(empty.style, { fontSize: '11px', color: 'rgba(200,195,185,0.4)', textAlign: 'center', padding: '10px' });
                        empty.textContent = '沒有可用的寵物';
                        listSec.appendChild(empty);
                  } else {
                        for (const pet of inactive) {
                              if (this._selectingSlot === 'main' && pet === this._subPet) continue;
                              if (this._selectingSlot === 'sub' && pet === this._mainPet) continue;

                              const row = document.createElement('div');
                              Object.assign(row.style, {
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '6px 8px', borderRadius: '4px', cursor: 'pointer',
                                    transition: 'background 0.15s, border-color 0.15s',
                                    borderBottom: '1px solid rgba(160,130,80,0.06)',
                                    border: '1px solid transparent',
                              });
                              row.addEventListener('mouseenter', () => {
                                    row.style.background = 'rgba(160,130,80,0.1)';
                                    row.style.borderColor = 'rgba(160,130,80,0.2)';
                              });
                              row.addEventListener('mouseleave', () => {
                                    row.style.background = '';
                                    row.style.borderColor = 'transparent';
                              });

                              const emoji = SERIES_EMOJI[pet.def.series] || '🐾';
                              row.innerHTML = `
                                    <span style="font-size:22px">${emoji}</span>
                                    <div style="flex:1">
                                          <div style="font-size:12px;color:rgba(220,215,200,0.85);font-weight:600">${pet.def.nameCN}</div>
                                          <div style="font-size:9px;color:rgba(200,195,185,0.5)">${pet.def.name} · Lv.${pet.stats.level}</div>
                                    </div>
                              `;

                              row.addEventListener('click', () => {
                                    if (this._selectingSlot === 'main') this._mainPet = pet;
                                    else this._subPet = pet;
                                    this._selectingSlot = null;
                                    this._render();
                              });
                              listSec.appendChild(row);
                        }
                  }
                  this._el.appendChild(listSec);
            }

            // ── BOTTOM BUTTONS ──
            const btnBar = document.createElement('div');
            Object.assign(btnBar.style, {
                  display: 'flex', gap: '10px', padding: '10px 14px',
                  justifyContent: 'center', alignItems: 'center',
                  borderTop: '2px solid rgba(160,130,80,0.3)',
                  background: 'linear-gradient(180deg, rgba(30,25,40,0.6) 0%, rgba(18,16,30,0.8) 100%)',
                  borderRadius: '0 0 6px 6px',
            });

            // GP indicator
            const gpLabel = document.createElement('span');
            Object.assign(gpLabel.style, {
                  fontSize: '11px', color: 'rgba(200,195,185,0.5)',
                  display: 'flex', alignItems: 'center', gap: '3px',
                  background: 'rgba(39,174,96,0.1)', padding: '3px 8px',
                  borderRadius: '3px', border: '1px solid rgba(39,174,96,0.2)',
            });
            gpLabel.innerHTML = '<span style="color:#27AE60;font-weight:700">GP</span>';

            // Fuse button
            const fuseBtn = document.createElement('button');
            const canFuse = this._mainPet && this._subPet && PetFusion.findRecipes(this._mainPet, this._subPet).length > 0;
            Object.assign(fuseBtn.style, {
                  padding: '8px 28px', fontSize: '13px', fontWeight: '700',
                  flex: '1', border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontFamily: "'Cinzel', serif", letterSpacing: '2px',
                  transition: 'all 0.15s',
                  background: canFuse
                        ? 'linear-gradient(180deg, #E8C96A, #C4993D)'
                        : 'linear-gradient(180deg, rgba(100,90,80,0.3), rgba(60,50,40,0.3))',
                  color: canFuse ? '#0A0E1A' : 'rgba(200,195,185,0.3)',
                  boxShadow: canFuse ? '0 2px 8px rgba(232,201,106,0.3)' : 'none',
            });
            fuseBtn.textContent = '合 成';
            if (!canFuse) fuseBtn.style.cursor = 'not-allowed';
            if (canFuse) {
                  fuseBtn.addEventListener('mouseenter', () => {
                        fuseBtn.style.boxShadow = '0 4px 16px rgba(232,201,106,0.5)';
                        fuseBtn.style.transform = 'translateY(-1px)';
                  });
                  fuseBtn.addEventListener('mouseleave', () => {
                        fuseBtn.style.boxShadow = '0 2px 8px rgba(232,201,106,0.3)';
                        fuseBtn.style.transform = '';
                  });
            }
            fuseBtn.addEventListener('click', () => { if (canFuse) this._executeFusion(); });

            // Close button
            const closeBtn2 = document.createElement('button');
            Object.assign(closeBtn2.style, {
                  padding: '8px 18px', fontSize: '12px', cursor: 'pointer',
                  background: 'rgba(160,130,80,0.1)', border: '1px solid rgba(160,130,80,0.25)',
                  borderRadius: '6px', color: 'rgba(200,195,185,0.7)', fontWeight: '600',
                  transition: 'all 0.15s',
            });
            closeBtn2.textContent = '關閉';
            closeBtn2.addEventListener('mouseenter', () => {
                  closeBtn2.style.borderColor = 'rgba(232,201,106,0.4)';
                  closeBtn2.style.color = '#E8C96A';
            });
            closeBtn2.addEventListener('mouseleave', () => {
                  closeBtn2.style.borderColor = 'rgba(160,130,80,0.25)';
                  closeBtn2.style.color = 'rgba(200,195,185,0.7)';
            });
            closeBtn2.addEventListener('click', () => this.close());

            btnBar.appendChild(gpLabel);
            btnBar.appendChild(fuseBtn);
            btnBar.appendChild(closeBtn2);
            this._el.appendChild(btnBar);
      }

      private _createPetSlot(label: string, pet: Pet | null, slot: 'main' | 'sub'): HTMLDivElement {
            const wrap = document.createElement('div');
            Object.assign(wrap.style, {
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
            });

            const slotEl = document.createElement('div');
            Object.assign(slotEl.style, {
                  width: '90px', height: '90px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative',
                  borderRadius: '10px',
                  transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                  // ── SOLID OPAQUE SLOT ──
                  background: pet
                        ? 'linear-gradient(180deg, rgba(40,30,60,0.9), rgba(25,20,38,0.95))'
                        : 'linear-gradient(180deg, rgba(25,20,35,0.8), rgba(15,12,22,0.9))',
                  border: pet
                        ? '2px solid rgba(232,201,106,0.45)'
                        : '2px dashed rgba(160,130,80,0.25)',
                  boxShadow: pet
                        ? '0 0 12px rgba(232,201,106,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
                        : 'inset 0 2px 6px rgba(0,0,0,0.3)',
            });

            if (pet) {
                  const emoji = SERIES_EMOJI[pet.def.series] || '🐾';
                  slotEl.innerHTML = `
                        <span style="font-size:36px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">${emoji}</span>
                        <span style="font-size:10px;color:rgba(220,215,200,0.85);margin-top:2px;font-weight:600">${pet.def.nameCN}</span>
                        <span style="font-size:9px;color:rgba(200,195,185,0.5)">Lv.${pet.stats.level}</span>
                  `;

                  const clearX = document.createElement('span');
                  clearX.textContent = '✕';
                  Object.assign(clearX.style, {
                        position: 'absolute', top: '3px', right: '5px',
                        fontSize: '11px', color: 'rgba(200,195,185,0.4)',
                        cursor: 'pointer', transition: 'color 0.15s',
                        lineHeight: '1',
                  });
                  clearX.addEventListener('mouseenter', () => clearX.style.color = '#E74C3C');
                  clearX.addEventListener('mouseleave', () => clearX.style.color = 'rgba(200,195,185,0.4)');
                  clearX.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (slot === 'main') this._mainPet = null;
                        else this._subPet = null;
                        this._render();
                  });
                  slotEl.appendChild(clearX);
            } else {
                  slotEl.innerHTML = `<span style="font-size:28px;color:rgba(200,195,185,0.15)">?</span>`;
            }

            slotEl.addEventListener('mouseenter', () => {
                  slotEl.style.borderColor = 'rgba(232,201,106,0.6)';
                  slotEl.style.boxShadow = '0 0 16px rgba(232,201,106,0.15), inset 0 1px 0 rgba(255,255,255,0.05)';
            });
            slotEl.addEventListener('mouseleave', () => {
                  slotEl.style.borderColor = pet ? 'rgba(232,201,106,0.45)' : 'rgba(160,130,80,0.25)';
                  slotEl.style.boxShadow = pet ? '0 0 12px rgba(232,201,106,0.1)' : 'inset 0 2px 6px rgba(0,0,0,0.3)';
            });
            // Click to select from list
            slotEl.addEventListener('click', () => {
                  this._selectingSlot = this._selectingSlot === slot ? null : slot;
                  this._render();
            });

            // ── DRAG-DROP: accept pets from PetPanel storage grid ──
            slotEl.addEventListener('dragover', (e) => {
                  e.preventDefault();
                  e.dataTransfer!.dropEffect = 'move';
                  slotEl.style.borderColor = '#E8C96A';
                  slotEl.style.boxShadow = '0 0 20px rgba(232,201,106,0.35), inset 0 0 8px rgba(232,201,106,0.1)';
                  slotEl.style.borderStyle = 'solid';
            });
            slotEl.addEventListener('dragleave', () => {
                  slotEl.style.borderColor = pet ? 'rgba(232,201,106,0.45)' : 'rgba(160,130,80,0.25)';
                  slotEl.style.boxShadow = pet ? '0 0 12px rgba(232,201,106,0.1)' : 'inset 0 2px 6px rgba(0,0,0,0.3)';
                  if (!pet) slotEl.style.borderStyle = 'dashed';
            });
            slotEl.addEventListener('drop', (e) => {
                  e.preventDefault();
                  slotEl.style.borderColor = pet ? 'rgba(232,201,106,0.45)' : 'rgba(160,130,80,0.25)';
                  slotEl.style.boxShadow = pet ? '0 0 12px rgba(232,201,106,0.1)' : 'inset 0 2px 6px rgba(0,0,0,0.3)';
                  if (!pet) slotEl.style.borderStyle = 'dashed';

                  const idxStr = e.dataTransfer?.getData('text/pet-index');
                  if (idxStr == null || idxStr === '') return;
                  const idx = parseInt(idxStr, 10);
                  if (isNaN(idx) || idx < 0 || idx >= this._petManager.owned.length) return;

                  const droppedPet = this._petManager.owned[idx];
                  if (!droppedPet || droppedPet.isActive || droppedPet.isDead) return;

                  // Don't allow same pet in both slots
                  if (slot === 'main' && droppedPet === this._subPet) return;
                  if (slot === 'sub' && droppedPet === this._mainPet) return;

                  if (slot === 'main') this._mainPet = droppedPet;
                  else this._subPet = droppedPet;
                  this._selectingSlot = null;
                  this._render();
            });

            const labelEl = document.createElement('div');
            Object.assign(labelEl.style, {
                  fontSize: '10px', color: 'rgba(200,195,185,0.5)',
                  fontWeight: '600', letterSpacing: '0.5px',
            });
            labelEl.textContent = label;

            wrap.appendChild(slotEl);
            wrap.appendChild(labelEl);
            return wrap;
      }

      private _executeFusion(): void {
            if (!this._mainPet || !this._subPet) return;

            const matches = PetFusion.findRecipes(this._mainPet, this._subPet);
            if (matches.length === 0) return;

            const match = matches[0];
            const result = PetFusion.fuse(this._mainPet, this._subPet, match.resultDef, this._hasProtection);

            this._showFusionResult(result, match);
      }

      private _showFusionResult(result: { success: boolean; resultId?: string; newLevel?: number; primaryLevelDrop?: number }, _match: FusionMatch): void {
            // Remove secondary pet
            const subIdx = this._petManager.owned.indexOf(this._subPet!);
            if (subIdx >= 0) {
                  const pet = this._petManager.owned[subIdx];
                  if (pet.isActive) {
                        const ai = this._petManager.active.indexOf(pet);
                        if (ai >= 0) this._petManager.recall(ai);
                  }
                  this._petManager.owned.splice(subIdx, 1);
                  pet.dispose();
            }

            if (result.success && result.resultId) {
                  const genders: Array<'male' | 'female'> = ['male', 'female'];
                  const gender = genders[Math.floor(Math.random() * 2)];
                  const newPet = this._petManager.addPet(result.resultId, gender);
                  if (newPet && result.newLevel) {
                        newPet.stats.level = result.newLevel;
                  }
                  const resultDef = PET_DEFS.find(d => d.id === result.resultId);
                  this._flashResult(true, `${resultDef?.nameCN ?? result.resultId} Lv.${result.newLevel}`);
            } else {
                  this._flashResult(false, `副寵已消耗${result.primaryLevelDrop ? `，主寵降 ${result.primaryLevelDrop} 級` : ''}`);
            }

            this._mainPet = null;
            this._subPet = null;
            setTimeout(() => this._render(), 1800);
      }

      private _flashResult(success: boolean, detail: string): void {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                  position: 'absolute', inset: '0',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  zIndex: '10',
                  background: success
                        ? 'linear-gradient(180deg, rgba(39,174,96,0.15), rgba(15,12,25,0.95))'
                        : 'linear-gradient(180deg, rgba(231,76,60,0.15), rgba(15,12,25,0.95))',
                  borderRadius: '6px',
            });
            overlay.innerHTML = `
                  <div style="font-size:42px;filter:drop-shadow(0 0 12px ${success ? 'rgba(39,174,96,0.5)' : 'rgba(231,76,60,0.5)'})">${success ? '✨' : '💥'}</div>
                  <div style="font-size:18px;font-weight:700;color:${success ? '#27AE60' : '#E74C3C'};margin-top:8px;text-shadow:0 0 8px ${success ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}">
                        ${success ? '合成成功！' : '合成失敗'}
                  </div>
                  <div style="font-size:12px;color:rgba(200,195,185,0.6);margin-top:6px">${detail}</div>
            `;
            this._el.style.position = 'fixed';
            this._el.appendChild(overlay);
            setTimeout(() => overlay.remove(), 1600);
      }

      dispose(): void {
            this._el.remove();
      }
}
