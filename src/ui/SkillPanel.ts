import { SKILL_DEFS, type SkillDef } from '../combat/CombatSystem';
import type { SkillBar } from './SkillBar';
import type { PetManager } from '../pets/PetManager';
import { PET_DEFS, SERIES_COLORS } from '../pets/PetData';

/**
 * SkillPanel - player/pet skill management panel.
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

            for (const s of SKILL_DEFS) this._skillLevels.set(s.id, 1);

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
            closeBtn.textContent = '✕';
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
            this._body.className = 'panel-body skill-panel-body';
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
                  <span class="skill-sp-label">技能點 SP</span>
                  <span class="skill-sp-value">${this._sp}</span>
            `;
            leftCol.appendChild(spBar);

            const equipSection = document.createElement('div');
            equipSection.className = 'sa-sec skill-section';
            const equipLabel = document.createElement('div');
            equipLabel.className = 'skill-section-title';
            equipLabel.textContent = focusMode ? '技能欄（拖放）' : '技能欄位（拖放裝備，點擊清除）';
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
                        slot.classList.add('is-drop-hover');
                  });
                  slot.addEventListener('dragleave', () => slot.classList.remove('is-drop-hover'));
                  slot.addEventListener('drop', (e) => {
                        e.preventDefault();
                        slot.classList.remove('is-drop-hover');
                        const skillId = e.dataTransfer?.getData('text/skill-id') ?? '';
                        if (!skillId) return;
                        this._equipSkillById(skillId, i);
                  });
                  if (equipped[i]) {
                        const skill = equipped[i]!;
                        const icon = document.createElement('div');
                        icon.className = 'skill-mini-icon';
                        icon.style.backgroundImage = `url(assets/icons/${skill.icon})`;
                        slot.appendChild(icon);
                        const name = document.createElement('span');
                        name.className = 'skill-slot-name';
                        name.textContent = skill.name;
                        slot.appendChild(name);
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
            for (const skill of SKILL_DEFS) skillGrid.appendChild(this._createSkillCard(skill));
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

            const card = document.createElement('div');
            card.className = 'skill-card game-card';
            card.draggable = true;
            card.addEventListener('click', () => this._equipSkillById(baseSkill.id));
            card.addEventListener('dragstart', (e) => {
                  e.dataTransfer?.setData('text/skill-id', baseSkill.id);
                  e.dataTransfer!.effectAllowed = 'copy';
            });

            const icon = document.createElement('div');
            icon.className = 'skill-card-icon';
            icon.style.backgroundImage = `url(assets/icons/${baseSkill.icon})`;

            const info = document.createElement('div');
            info.className = 'skill-card-info';

            const name = document.createElement('div');
            name.className = 'skill-card-name';
            name.innerHTML = `${baseSkill.name} <span class="skill-card-level">Lv.${level}</span>`;

            const stats = document.createElement('div');
            stats.className = 'skill-card-stats';
            const type = document.createElement('span');
            type.className = 'skill-card-type';
            type.textContent = typeLabels[baseSkill.type] ?? baseSkill.type;
            type.style.color = typeColors[baseSkill.type] ?? '#aaa';
            const mp = document.createElement('span');
            mp.textContent = `MP:${skill.mpCost}`;
            const cd = document.createElement('span');
            cd.textContent = `CD:${skill.cooldown.toFixed(1)}s`;
            stats.appendChild(type);
            stats.appendChild(mp);
            stats.appendChild(cd);

            const mult = document.createElement('div');
            mult.className = 'skill-card-mult';
            mult.textContent = `x${skill.multiplier.toFixed(2)}`;

            info.appendChild(name);
            info.appendChild(stats);
            info.appendChild(mult);

            const upBtn = document.createElement('button');
            upBtn.className = 'btn-gold skill-up-btn';
            upBtn.textContent = this._sp > 0
                  ? (focusMode ? '升級' : '升級 -1SP')
                  : (focusMode ? '不足' : 'SP不足');
            upBtn.title = this._sp > 0 ? '消耗 1 SP 升級技能' : 'SP不足';
            upBtn.disabled = this._sp <= 0;
            upBtn.classList.toggle('is-disabled', this._sp <= 0);
            upBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  this._upgradeSkill(baseSkill.id);
            });

            card.appendChild(icon);
            card.appendChild(info);
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
            const base = SKILL_DEFS.find((s) => s.id === skillId);
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
      }

      private _refreshEquippedSkills(): void {
            const equipped = this._skillBar.getEquipped();
            for (let i = 0; i < equipped.length; i++) {
                  const now = equipped[i];
                  if (!now) continue;
                  const base = SKILL_DEFS.find((s) => s.id === now.id);
                  if (!base) continue;
                  this._skillBar.setSkill(i, this._runtimeSkill(base));
            }
      }

      private _runtimeSkill(base: SkillDef): SkillDef {
            const level = this._skillLevels.get(base.id) ?? 1;
            const multBonus = 1 + (level - 1) * 0.08;
            return { ...base, multiplier: Number((base.multiplier * multBonus).toFixed(2)) };
      }

      private _renderPetTab(): void {
            if (!this._petManager) {
                  this._body.innerHTML = '<div class="skill-empty-tip">尚未載入寵物資料</div>';
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
                        const icon = document.createElement('div');
                        icon.className = 'skill-mini-icon is-circle';
                        icon.style.background = colorHex;
                        slot.appendChild(icon);
                        const name = document.createElement('span');
                        name.className = 'skill-slot-name';
                        name.textContent = pet.def.name;
                        slot.appendChild(name);
                  }
                  slotGrid.appendChild(slot);
            }
            section.appendChild(slotGrid);
            leftCol.appendChild(section);

            if (activePets.length === 0) {
                  const empty = document.createElement('div');
                  empty.className = 'sa-sec skill-section';
                  empty.innerHTML = '<div class="skill-empty-tip is-small">目前沒有出戰寵物</div>';
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
                  const petDef = PET_DEFS.find((d) => d.id === pet.def.id);
                  const skills = petDef?.skills ?? [];
                  const seriesColor = SERIES_COLORS[pet.def.series];
                  const colorHex = `rgb(${Math.round(seriesColor.r * 255)},${Math.round(seriesColor.g * 255)},${Math.round(seriesColor.b * 255)})`;

                  const card = document.createElement('div');
                  card.className = 'skill-card game-card skill-card-static';

                  let skillHtml = '<span class="skill-card-no-skill">無技能</span>';
                  if (skills.length > 0) {
                        const sk = skills[0];
                        const atkType = pet.def.attackType === 'melee' ? '⚔近攻' : '🏹遠攻';
                        skillHtml = `
                              <div class="skill-card-name">${sk.name}</div>
                              <div class="skill-card-stats">
                                    <span class="skill-card-dmg">DMG:${sk.damage}</span>
                                    <span>CD:${sk.cooldown}s</span>
                                    <span class="skill-card-attack">${atkType}</span>
                              </div>
                        `;
                  }

                  card.innerHTML = `
                        <div class="skill-card-icon is-circle"></div>
                        <div class="skill-card-info">
                              <div class="skill-pet-title">
                                    ${pet.def.name} <span class="skill-pet-level">Lv.${pet.stats.level}</span>
                              </div>
                              ${skillHtml}
                        </div>
                  `;
                  const cardIcon = card.querySelector('.skill-card-icon') as HTMLDivElement | null;
                  if (cardIcon) cardIcon.style.background = colorHex;
                  const attack = card.querySelector('.skill-card-attack') as HTMLSpanElement | null;
                  if (attack) attack.style.color = colorHex;
                  detailSection.appendChild(card);
            }

            rightCol.appendChild(detailSection);
            const note = document.createElement('div');
            note.className = 'skill-note';
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

