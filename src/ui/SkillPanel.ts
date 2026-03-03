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
      }

      setPetManager(pm: PetManager): void {
            this._petManager = pm;
      }

      private _buildShell(): void {
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '⚔️ 技能設定';

            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            const tabBar = document.createElement('div');
            tabBar.className = 'sa-sec';
            tabBar.style.cssText = 'display:flex;gap:4px;padding:4px 8px';

            const playerTab = document.createElement('div');
            playerTab.className = 'sa-tag sa-tag-active';
            playerTab.id = 'skill-tab-player';
            playerTab.textContent = '⚔ 主角技能';
            playerTab.addEventListener('click', () => this._switchTab('player'));

            const petTab = document.createElement('div');
            petTab.className = 'sa-tag';
            petTab.id = 'skill-tab-pet';
            petTab.textContent = '🐾 寵物技能';
            petTab.addEventListener('click', () => this._switchTab('pet'));

            tabBar.appendChild(playerTab);
            tabBar.appendChild(petTab);
            this._el.appendChild(tabBar);

            this._body = document.createElement('div');
            this._body.className = 'panel-body';
            this._body.style.padding = '8px 12px';
            this._el.appendChild(this._body);
      }

      private _switchTab(tab: 'player' | 'pet'): void {
            this._activeTab = tab;
            const playerTab = this._el.querySelector('#skill-tab-player');
            const petTab = this._el.querySelector('#skill-tab-pet');
            if (playerTab) playerTab.className = tab === 'player' ? 'sa-tag sa-tag-active' : 'sa-tag';
            if (petTab) petTab.className = tab === 'pet' ? 'sa-tag sa-tag-active' : 'sa-tag';
            this._renderContent();
      }

      private _renderContent(): void {
            this._body.innerHTML = '';
            if (this._activeTab === 'player') this._renderPlayerTab();
            else this._renderPetTab();
      }

      // -- Player Tab --

      private _renderPlayerTab(): void {
            const spBar = document.createElement('div');
            spBar.className = 'sa-sec';
            spBar.style.cssText = 'padding:6px 8px;display:flex;justify-content:space-between;align-items:center';
            spBar.innerHTML = `
                  <span style="color:rgba(232,201,106,0.85);font-size:11px;font-weight:700">技能點數 SP</span>
                  <span style="color:rgba(220,215,200,0.9);font-size:12px;font-weight:700">${this._sp}</span>
            `;
            this._body.appendChild(spBar);

            const equipSection = document.createElement('div');
            equipSection.className = 'sa-sec';
            const equipLabel = document.createElement('div');
            equipLabel.style.cssText = 'color:rgba(232,201,106,0.8);font-size:11px;font-weight:700;margin-bottom:6px';
            equipLabel.textContent = '技能欄 (F1-F5) - 可拖放，點擊可清除';
            equipSection.appendChild(equipLabel);

            const equipGrid = document.createElement('div');
            equipGrid.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px';

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
            this._body.appendChild(equipSection);

            const allSection = document.createElement('div');
            allSection.className = 'sa-sec';
            const allLabel = document.createElement('div');
            allLabel.style.cssText = 'color:rgba(232,201,106,0.8);font-size:11px;font-weight:700;margin-bottom:6px';
            allLabel.textContent = '所有技能 (點擊裝備 / 升級提升倍率)';
            allSection.appendChild(allLabel);

            const skillGrid = document.createElement('div');
            skillGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px';
            for (const skill of SKILL_DEFS) {
                  skillGrid.appendChild(this._createSkillCard(skill));
            }
            allSection.appendChild(skillGrid);
            this._body.appendChild(allSection);
      }

      private _createSkillCard(baseSkill: SkillDef): HTMLDivElement {
            const skill = this._runtimeSkill(baseSkill);
            const level = this._skillLevels.get(baseSkill.id) ?? 1;

            const card = document.createElement('div');
            card.className = 'skill-card';
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
                  attack: '⚔️攻擊',
                  heal: '💚回復',
                  buff: '🛡️增益',
                  debuff: '💀減益',
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
            upBtn.textContent = this._sp > 0 ? '升級 -1SP' : 'SP不足';
            upBtn.style.cssText = 'margin-left:4px;padding:4px 6px;font-size:10px;min-width:58px;opacity:' + (this._sp > 0 ? '1' : '0.45');
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
                  this._body.innerHTML = '<div style="color:rgba(200,195,185,0.5);text-align:center;padding:20px;font-size:12px">尚未載入</div>';
                  return;
            }

            const activePets = this._petManager.active;

            const section = document.createElement('div');
            section.className = 'sa-sec';
            const label = document.createElement('div');
            label.style.cssText = 'color:rgba(232,201,106,0.8);font-size:11px;font-weight:700;margin-bottom:6px';
            label.textContent = `出戰寵物技能 (${activePets.length}/3)`;
            section.appendChild(label);

            const slotGrid = document.createElement('div');
            slotGrid.style.cssText = 'display:flex;gap:4px;margin-bottom:8px';

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
            this._body.appendChild(section);

            if (activePets.length === 0) {
                  this._body.innerHTML += '<div style="color:rgba(200,195,185,0.4);text-align:center;padding:12px;font-size:11px">沒有出戰寵物</div>';
                  return;
            }

            const detailSection = document.createElement('div');
            detailSection.className = 'sa-sec';
            const detailLabel = document.createElement('div');
            detailLabel.style.cssText = 'color:rgba(232,201,106,0.8);font-size:11px;font-weight:700;margin-bottom:6px';
            detailLabel.textContent = '寵物技能詳情';
            detailSection.appendChild(detailLabel);

            for (const pet of activePets) {
                  const petDef = PET_DEFS.find(d => d.id === pet.def.id);
                  const skills = petDef?.skills ?? [];
                  const seriesColor = SERIES_COLORS[pet.def.series];
                  const colorHex = `rgb(${Math.round(seriesColor.r * 255)},${Math.round(seriesColor.g * 255)},${Math.round(seriesColor.b * 255)})`;

                  const card = document.createElement('div');
                  card.className = 'skill-card';
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
            this._body.appendChild(detailSection);

            const note = document.createElement('div');
            note.style.cssText = 'color:rgba(200,195,185,0.3);font-size:9px;text-align:center;padding:6px';
            note.textContent = '寵物技能由戰鬥輪流自動施放';
            this._body.appendChild(note);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._renderContent(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
