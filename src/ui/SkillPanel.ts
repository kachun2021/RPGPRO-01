import { SKILL_DEFS, type SkillDef } from '../combat/CombatSystem';
import type { SkillBar } from './SkillBar';
import type { PetManager } from '../pets/PetManager';
import { PET_DEFS, SERIES_COLORS } from '../pets/PetData';

/**
 * SkillPanel - center popup with player/pet tabs.
 * Player tab supports:
 * - SP-based skill upgrades
 * - drag-drop and click equip to SkillBar slots
 */
export class SkillPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _skillBar: SkillBar;
      private _petManager: PetManager | null = null;
      private _body!: HTMLDivElement;
      private _activeTab: 'player' | 'pet' = 'player';
      private _sp = 12;
      private _skillLevels = new Map<string, number>();
      private _onResize = (): void => {
            if (!this._visible) return;
            this._syncResponsiveMode();
            this._fitBodyScale();
      };

      constructor(skillBar: SkillBar, petManager?: PetManager) {
            this._skillBar = skillBar;
            this._petManager = petManager ?? null;

            for (const s of SKILL_DEFS) {
                  this._skillLevels.set(s.id, 1);
            }

            this._el = document.createElement('div');
            this._el.id = 'skill-panel';
            this._el.className = 'sa-panel skill-panel';
            this._el.style.display = 'none';

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      setPetManager(pm: PetManager): void {
            this._petManager = pm;
      }

      private _buildShell(): void {
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '⚡ 技能設定';

            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            const tabBar = document.createElement('div');
            tabBar.className = 'skill-tabs';

            const playerTab = document.createElement('button');
            playerTab.type = 'button';
            playerTab.className = 'skill-tab-btn active';
            playerTab.id = 'skill-tab-player';
            playerTab.textContent = '主角';
            playerTab.addEventListener('click', () => this._switchTab('player'));

            const petTab = document.createElement('button');
            petTab.type = 'button';
            petTab.className = 'skill-tab-btn';
            petTab.id = 'skill-tab-pet';
            petTab.textContent = '寵物';
            petTab.addEventListener('click', () => this._switchTab('pet'));

            tabBar.appendChild(playerTab);
            tabBar.appendChild(petTab);
            this._el.appendChild(tabBar);

            this._body = document.createElement('div');
            this._body.className = 'panel-body';
            this._body.style.padding = '8px 10px 10px';
            this._el.appendChild(this._body);
      }

      private _switchTab(tab: 'player' | 'pet'): void {
            this._activeTab = tab;
            const playerTab = this._el.querySelector('#skill-tab-player');
            const petTab = this._el.querySelector('#skill-tab-pet');
            if (playerTab) playerTab.className = tab === 'player' ? 'skill-tab-btn active' : 'skill-tab-btn';
            if (petTab) petTab.className = tab === 'pet' ? 'skill-tab-btn active' : 'skill-tab-btn';
            this._renderContent();
      }

      private _isLandscapeFocusMode(): boolean {
            const w = window.innerWidth || 0;
            const h = window.innerHeight || 0;
            return w > h && w <= 1600 && h <= 900;
      }

      private _syncResponsiveMode(): void {
            this._el.classList.toggle('is-focus-mode', this._isLandscapeFocusMode());
      }

      private _renderContent(): void {
            this._syncResponsiveMode();
            this._body.innerHTML = '';
            if (this._activeTab === 'player') this._renderPlayerTab();
            else this._renderPetTab();
            requestAnimationFrame(() => this._fitBodyScale());
      }

      private _fitBodyScale(): void {
            const root = this._body.firstElementChild as HTMLElement | null;
            if (!root) return;
            this._el.style.transformOrigin = 'center center';
            this._el.style.transform = 'translate(-50%, -50%) scale(1)';

            const available = this._body.clientHeight;
            if (available <= 0) return;

            const needed = root.scrollHeight;
            if (needed <= 0 || needed <= available) return;

            const scale = Math.max(0.58, Math.min(1, available / needed));
            this._el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }

      // -- Player Tab --

      private _renderPlayerTab(): void {
            const focusMode = this._isLandscapeFocusMode();

            const layout = document.createElement('div');
            layout.className = 'skill-layout skill-layout-player';
            const leftCol = document.createElement('div');
            leftCol.className = 'skill-col skill-left';
            const rightCol = document.createElement('div');
            rightCol.className = 'skill-col skill-right';

            const spBar = document.createElement('div');
            spBar.className = 'sa-sec skill-sp-bar';
            spBar.innerHTML = `
                  <span style="color:rgba(232,201,106,0.85);font-size:11px;font-weight:700">技能點 SP</span>
                  <span style="color:rgba(220,215,200,0.9);font-size:12px;font-weight:700">${this._sp}</span>
            `;
            leftCol.appendChild(spBar);

            const equipSection = document.createElement('div');
            equipSection.className = 'sa-sec skill-section';
            const equipLabel = document.createElement('div');
            equipLabel.className = 'skill-section-title';
            equipLabel.textContent = focusMode ? '技能槽（拖放）' : '技能槽位（拖放裝備，點擊清除）';
            equipSection.appendChild(equipLabel);

            const equipGrid = document.createElement('div');
            equipGrid.className = 'skill-equip-grid';

            const equipped = this._skillBar.getEquipped();
            for (let i = 0; i < 5; i++) {
                  const slot = document.createElement('div');
                  slot.className = 'dark-slot skill-equip-slot';
                  slot.innerHTML = `<span class="skill-slot-key">F${i + 1}</span>`;
                  slot.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        slot.style.borderColor = 'rgba(232,201,106,0.5)';
                  });
                  slot.addEventListener('dragleave', () => {
                        slot.style.borderColor = '';
                  });
                  slot.addEventListener('drop', (e) => {
                        e.preventDefault();
                        slot.style.borderColor = '';
                        const skillId = e.dataTransfer?.getData('text/skill-id') ?? '';
                        if (!skillId) return;
                        this._equipSkillById(skillId, i);
                  });

                  if (equipped[i]) {
                        const skill = equipped[i]!;
                        slot.innerHTML += `<div class="skill-mini-icon" style="background-image:url(assets/icons/${skill.icon})"></div>`;
                        slot.innerHTML += `<span class="skill-slot-name">${skill.name}</span>`;
                  }
                  const idx = i;
                  slot.addEventListener('click', () => {
                        this._skillBar.setSkill(idx, null);
                        this._renderContent();
                  });
                  equipGrid.appendChild(slot);
            }
            equipSection.appendChild(equipGrid);
            leftCol.appendChild(equipSection);

            const allSection = document.createElement('div');
            allSection.className = 'sa-sec skill-section';
            const allLabel = document.createElement('div');
            allLabel.className = 'skill-section-title';
            allLabel.textContent = focusMode ? '可用技能（點擊裝備）' : '技能清單（點擊裝備，升級可提高倍率）';
            allSection.appendChild(allLabel);

            const skillGrid = document.createElement('div');
            skillGrid.className = 'skill-cards-grid';
            for (const skill of SKILL_DEFS) {
                  skillGrid.appendChild(this._createSkillCard(skill));
            }
            allSection.appendChild(skillGrid);
            rightCol.appendChild(allSection);
            layout.appendChild(leftCol);
            layout.appendChild(rightCol);
            this._body.appendChild(layout);
      }

      private _createSkillCard(baseSkill: SkillDef): HTMLDivElement {
            const skill = this._runtimeSkill(baseSkill);
            const level = this._skillLevels.get(baseSkill.id) ?? 1;
            const focusMode = this._isLandscapeFocusMode();

            const card = document.createElement('div');
            card.className = 'skill-card game-card';
            card.draggable = true;
            card.addEventListener('click', () => this._equipSkillById(baseSkill.id));
            card.addEventListener('dragstart', (e) => {
                  e.dataTransfer?.setData('text/skill-id', baseSkill.id);
                  e.dataTransfer!.effectAllowed = 'copy';
            });

            const typeColors: Record<string, string> = {
                  attack: '#E74C3C',
                  heal: '#27AE60',
                  buff: '#3498DB',
                  debuff: '#9B59B6',
            };
            const typeLabels: Record<string, string> = {
                  attack: '攻擊',
                  heal: '治療',
                  buff: '增益',
                  debuff: '減益',
            };

            card.innerHTML = `
                  <div class="skill-card-icon" style="background-image:url(assets/icons/${baseSkill.icon})"></div>
                  <div class="skill-card-info">
                        <div class="skill-card-name">${baseSkill.name} <span style="color:rgba(232,201,106,0.7);font-size:10px">Lv.${level}</span></div>
                        <div class="skill-card-stats">
                              <span style="color:${typeColors[baseSkill.type] ?? '#aaa'}">${typeLabels[baseSkill.type] ?? baseSkill.type}</span>
                              <span>MP:${skill.mpCost}</span>
                              <span>CD:${skill.cooldown.toFixed(1)}s</span>
                        </div>
                        <div class="skill-card-mult">x${skill.multiplier.toFixed(2)}</div>
                  </div>
            `;

            const upBtn = document.createElement('button');
            upBtn.className = 'btn-gold';
            upBtn.textContent = this._sp > 0
                  ? (focusMode ? '升級' : '升級 -1SP')
                  : (focusMode ? '不足' : 'SP不足');
            upBtn.title = this._sp > 0 ? '消耗 1 SP 升級技能' : 'SP不足';
            upBtn.style.cssText = 'margin-left:4px;padding:4px 6px;font-size:10px;min-width:62px;opacity:' + (this._sp > 0 ? '1' : '0.45');
            upBtn.disabled = this._sp <= 0;
            upBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  this._upgradeSkill(baseSkill.id);
            });
            card.appendChild(upBtn);
            return card;
      }

      private _upgradeSkill(skillId: string): void {
            if (this._sp <= 0) return;
            this._sp -= 1;
            const curr = this._skillLevels.get(skillId) ?? 1;
            this._skillLevels.set(skillId, curr + 1);
            this._refreshEquippedSkills();
            this._renderContent();
      }

      private _equipSkillById(skillId: string, targetIdx?: number): void {
            const base = SKILL_DEFS.find(s => s.id === skillId);
            if (!base) return;
            const runtime = this._runtimeSkill(base);

            let slot = targetIdx ?? -1;
            if (slot < 0) {
                  const equipped = this._skillBar.getEquipped();
                  slot = equipped.findIndex((s: SkillDef | null) => s === null);
                  if (slot < 0) slot = 4;
            }
            this._skillBar.setSkill(slot, runtime);
            this._renderContent();
            console.log('[Skill] Equipped:', runtime.name, 'to F' + (slot + 1));
      }

      private _refreshEquippedSkills(): void {
            const equipped = this._skillBar.getEquipped();
            for (let i = 0; i < equipped.length; i++) {
                  const now = equipped[i];
                  if (!now) continue;
                  const base = SKILL_DEFS.find(s => s.id === now.id);
                  if (!base) continue;
                  this._skillBar.setSkill(i, this._runtimeSkill(base));
            }
      }

      private _runtimeSkill(base: SkillDef): SkillDef {
            const level = this._skillLevels.get(base.id) ?? 1;
            const multBonus = 1 + (level - 1) * 0.08;
            return {
                  ...base,
                  multiplier: Number((base.multiplier * multBonus).toFixed(2)),
            };
      }

      // -- Pet Tab --

      private _renderPetTab(): void {
            if (!this._petManager) {
                  this._body.innerHTML = '<div style="color:rgba(200,195,185,0.5);text-align:center;padding:20px;font-size:12px">尚未載入寵物資料</div>';
                  return;
            }

            const activePets = this._petManager.active;
            const layout = document.createElement('div');
            layout.className = 'skill-layout skill-layout-pet';
            const leftCol = document.createElement('div');
            leftCol.className = 'skill-col skill-left';
            const rightCol = document.createElement('div');
            rightCol.className = 'skill-col skill-right';

            const section = document.createElement('div');
            section.className = 'sa-sec skill-section';
            const label = document.createElement('div');
            label.className = 'skill-section-title';
            label.textContent = `出戰寵物 (${activePets.length}/3)`;
            section.appendChild(label);

            const slotGrid = document.createElement('div');
            slotGrid.className = 'skill-equip-grid skill-pet-grid';

            for (let i = 0; i < 3; i++) {
                  const slot = document.createElement('div');
                  slot.className = 'dark-slot skill-equip-slot';
                  slot.innerHTML = `<span class="skill-slot-key">P${i + 1}</span>`;
                  if (i < activePets.length) {
                        const pet = activePets[i];
                        const seriesColor = SERIES_COLORS[pet.def.series];
                        const colorHex = `rgb(${Math.round(seriesColor.r * 255)},${Math.round(seriesColor.g * 255)},${Math.round(seriesColor.b * 255)})`;
                        slot.innerHTML += `<div class="skill-mini-icon" style="background:${colorHex};border-radius:50%"></div>`;
                        slot.innerHTML += `<span class="skill-slot-name">${pet.def.name}</span>`;
                  }
                  slotGrid.appendChild(slot);
            }
            section.appendChild(slotGrid);
            leftCol.appendChild(section);

            if (activePets.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'sa-sec skill-section';
                  empty.innerHTML = '<div style="color:rgba(200,195,185,0.4);text-align:center;padding:12px;font-size:11px">目前沒有出戰寵物</div>';
                  rightCol.appendChild(empty);
                  layout.appendChild(leftCol);
                  layout.appendChild(rightCol);
                  this._body.appendChild(layout);
                  return;
            }

            const detailSection = document.createElement('div');
            detailSection.className = 'sa-sec skill-section';
            const detailLabel = document.createElement('div');
            detailLabel.className = 'skill-section-title';
            detailLabel.textContent = '寵物技能資訊';
            detailSection.appendChild(detailLabel);

            for (const pet of activePets) {
                  const petDef = PET_DEFS.find(d => d.id === pet.def.id);
                  const skills = petDef?.skills ?? [];
                  const seriesColor = SERIES_COLORS[pet.def.series];
                  const colorHex = `rgb(${Math.round(seriesColor.r * 255)},${Math.round(seriesColor.g * 255)},${Math.round(seriesColor.b * 255)})`;

                  const card = document.createElement('div');
                  card.className = 'skill-card game-card';
                  card.style.cssText = 'margin-bottom:4px;cursor:default';

                  let skillHtml = '<span style="color:rgba(200,195,185,0.4);font-size:10px">無技能</span>';
                  if (skills.length > 0) {
                        const sk = skills[0];
                        skillHtml = `
                              <div class="skill-card-name">${sk.name}</div>
                              <div class="skill-card-stats">
                                    <span style="color:#E74C3C">DMG:${sk.damage}</span>
                                    <span>CD:${sk.cooldown}s</span>
                                    <span style="color:${colorHex}">${pet.def.attackType === 'melee' ? '⚔近攻' : '🏹遠攻'}</span>
                              </div>
                        `;
                  }

                  card.innerHTML = `
                        <div class="skill-card-icon" style="background:${colorHex};border-radius:50%"></div>
                        <div class="skill-card-info">
                              <div style="color:rgba(220,215,200,0.8);font-size:11px;font-weight:600">
                                    ${pet.def.name} <span style="color:rgba(200,195,185,0.4)">Lv.${pet.stats.level}</span>
                              </div>
                              ${skillHtml}
                        </div>
                  `;
                  detailSection.appendChild(card);
            }
            rightCol.appendChild(detailSection);

            const note = document.createElement('div');
            note.style.cssText = 'color:rgba(200,195,185,0.3);font-size:9px;text-align:center;padding:6px';
            note.textContent = '寵物技能由戰鬥 AI 自動施放';
            rightCol.appendChild(note);
            layout.appendChild(leftCol);
            layout.appendChild(rightCol);
            this._body.appendChild(layout);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void {
            this._visible = true;
            this._syncResponsiveMode();
            this._el.style.display = 'block';
            this._renderContent();
      }
      hide(): void {
            this._visible = false;
            this._el.style.display = 'none';
      }
      dispose(): void {
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
