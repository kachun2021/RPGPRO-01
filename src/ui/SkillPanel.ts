import { SKILL_DEFS, type SkillDef } from '../combat/CombatSystem';
import type { SkillBar } from './SkillBar';
import type { PetManager } from '../pets/PetManager';
import { PET_DEFS, SERIES_COLORS } from '../pets/PetData';

/**
 * SkillPanel — Center popup with Player/Pet tabs.
 * Player tab: 5 equip slots + 12 skill cards (click to equip)
 * Pet tab: read-only view of active pets and their skills
 */
export class SkillPanel {
      private _el: HTMLDivElement;
      private _visible = false;
      private _skillBar: SkillBar;
      private _petManager: PetManager | null = null;
      private _body!: HTMLDivElement;
      private _activeTab: 'player' | 'pet' = 'player';

      constructor(skillBar: SkillBar, petManager?: PetManager) {
            this._skillBar = skillBar;
            this._petManager = petManager ?? null;

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
            // Title bar
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.innerHTML = '\u2694\uFE0F \u6280\u80FD\u8A2D\u5B9A';

            const closeBtn = document.createElement('span');
            closeBtn.className = 'panel-close';
            closeBtn.textContent = '\u00D7';
            closeBtn.addEventListener('click', () => this.hide());
            title.appendChild(closeBtn);
            this._el.appendChild(title);

            // Tab bar
            const tabBar = document.createElement('div');
            tabBar.className = 'sa-sec';
            tabBar.style.cssText = 'display:flex;gap:4px;padding:4px 8px';

            const playerTab = document.createElement('div');
            playerTab.className = 'sa-tag sa-tag-active';
            playerTab.id = 'skill-tab-player';
            playerTab.textContent = '\u2694 \u4E3B\u89D2\u6280\u80FD';
            playerTab.addEventListener('click', () => this._switchTab('player'));

            const petTab = document.createElement('div');
            petTab.className = 'sa-tag';
            petTab.id = 'skill-tab-pet';
            petTab.textContent = '\uD83D\uDC3E \u5BF5\u7269\u6280\u80FD';
            petTab.addEventListener('click', () => this._switchTab('pet'));

            tabBar.appendChild(playerTab);
            tabBar.appendChild(petTab);
            this._el.appendChild(tabBar);

            // Body
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
            if (this._activeTab === 'player') {
                  this._renderPlayerTab();
            } else {
                  this._renderPetTab();
            }
      }

      // ── Player Tab ──

      private _renderPlayerTab(): void {
            // Equip section (5 slots)
            const equipSection = document.createElement('div');
            equipSection.className = 'sa-sec';
            const equipLabel = document.createElement('div');
            equipLabel.style.cssText = 'color:rgba(232,201,106,0.8);font-size:11px;font-weight:700;margin-bottom:6px';
            equipLabel.textContent = '\u6280\u80FD\u6B04 (F1-F5) \u2014 \u9EDE\u64CA\u6E05\u9664';
            equipSection.appendChild(equipLabel);

            const equipGrid = document.createElement('div');
            equipGrid.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px';

            const equipped = this._skillBar.getEquipped();
            for (let i = 0; i < 5; i++) {
                  const slot = document.createElement('div');
                  slot.className = 'dark-slot skill-equip-slot';
                  slot.innerHTML = `<span class="skill-slot-key">F${i + 1}</span>`;
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

            // All 12 skills
            const allSection = document.createElement('div');
            allSection.className = 'sa-sec';
            const allLabel = document.createElement('div');
            allLabel.style.cssText = 'color:rgba(232,201,106,0.8);font-size:11px;font-weight:700;margin-bottom:6px';
            allLabel.textContent = '\u6240\u6709\u6280\u80FD (\u9EDE\u64CA\u88DD\u5099)';
            allSection.appendChild(allLabel);

            const skillGrid = document.createElement('div');
            skillGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px';
            for (const skill of SKILL_DEFS) {
                  skillGrid.appendChild(this._createSkillCard(skill));
            }
            allSection.appendChild(skillGrid);
            this._body.appendChild(allSection);
      }

      private _createSkillCard(skill: SkillDef): HTMLDivElement {
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.addEventListener('click', () => this._equipSkill(skill));

            const typeColors: Record<string, string> = {
                  attack: '#E74C3C', heal: '#27AE60', buff: '#3498DB', debuff: '#9B59B6',
            };
            const typeLabels: Record<string, string> = {
                  attack: '\u2694\uFE0F\u653B\u64CA', heal: '\uD83D\uDC9A\u56DE\u5FA9',
                  buff: '\uD83D\uDEE1\uFE0F\u589E\u76CA', debuff: '\uD83D\uDC80\u6E1B\u76CA',
            };

            card.innerHTML = `
                  <div class="skill-card-icon" style="background-image:url(assets/icons/${skill.icon})"></div>
                  <div class="skill-card-info">
                        <div class="skill-card-name">${skill.name}</div>
                        <div class="skill-card-stats">
                              <span style="color:${typeColors[skill.type] ?? '#aaa'}">${typeLabels[skill.type] ?? skill.type}</span>
                              <span>MP:${skill.mpCost}</span>
                              <span>CD:${skill.cooldown}s</span>
                        </div>
                        <div class="skill-card-mult">\u00D7${skill.multiplier}</div>
                  </div>
            `;
            return card;
      }

      private _equipSkill(skill: SkillDef): void {
            const equipped = this._skillBar.getEquipped();
            let targetIdx = equipped.findIndex((s: SkillDef | null) => s === null);
            if (targetIdx < 0) targetIdx = 4; // replace last
            this._skillBar.setSkill(targetIdx, skill);
            this._renderContent();
            console.log('[Skill] Equipped:', skill.name, 'to F' + (targetIdx + 1));
      }

      // ── Pet Tab (read-only) ──

      private _renderPetTab(): void {
            if (!this._petManager) {
                  this._body.innerHTML = '<div style="color:rgba(200,195,185,0.5);text-align:center;padding:20px;font-size:12px">\u5C1A\u672A\u8F09\u5165</div>';
                  return;
            }

            const activePets = this._petManager.active;

            // Active pet slots header
            const section = document.createElement('div');
            section.className = 'sa-sec';
            const label = document.createElement('div');
            label.style.cssText = 'color:rgba(232,201,106,0.8);font-size:11px;font-weight:700;margin-bottom:6px';
            label.textContent = `\u51FA\u6230\u5BF5\u7269\u6280\u80FD (${activePets.length}/3)`;
            section.appendChild(label);

            // 3 equip-style slots (read-only)
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

            // Pet skill details
            if (activePets.length === 0) {
                  this._body.innerHTML += '<div style="color:rgba(200,195,185,0.4);text-align:center;padding:12px;font-size:11px">\u6C92\u6709\u51FA\u6230\u5BF5\u7269</div>';
                  return;
            }

            const detailSection = document.createElement('div');
            detailSection.className = 'sa-sec';
            const detailLabel = document.createElement('div');
            detailLabel.style.cssText = 'color:rgba(232,201,106,0.8);font-size:11px;font-weight:700;margin-bottom:6px';
            detailLabel.textContent = '\u5BF5\u7269\u6280\u80FD\u8A73\u60C5';
            detailSection.appendChild(detailLabel);

            for (const pet of activePets) {
                  const petDef = PET_DEFS.find(d => d.id === pet.def.id);
                  const skills = petDef?.skills ?? [];
                  const seriesColor = SERIES_COLORS[pet.def.series];
                  const colorHex = `rgb(${Math.round(seriesColor.r * 255)},${Math.round(seriesColor.g * 255)},${Math.round(seriesColor.b * 255)})`;

                  const card = document.createElement('div');
                  card.className = 'skill-card';
                  card.style.cssText = 'margin-bottom:4px;cursor:default';

                  let skillHtml = '<span style="color:rgba(200,195,185,0.4);font-size:10px">\u7121\u6280\u80FD</span>';
                  if (skills.length > 0) {
                        const sk = skills[0];
                        skillHtml = `
                              <div class="skill-card-name">${sk.name}</div>
                              <div class="skill-card-stats">
                                    <span style="color:#E74C3C">DMG:${sk.damage}</span>
                                    <span>CD:${sk.cooldown}s</span>
                                    <span style="color:${colorHex}">${pet.def.attackType === 'melee' ? '\u2694\u8FD1\u653B' : '\uD83C\uDFF9\u9060\u653B'}</span>
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

            // Note
            const note = document.createElement('div');
            note.style.cssText = 'color:rgba(200,195,185,0.3);font-size:9px;text-align:center;padding:6px';
            note.textContent = '\u5BF5\u7269\u6280\u80FD\u96A8\u7B49\u7D1A\u81EA\u52D5\u5347\u7D1A\uFF0C\u6BCF\u96BB 1 \u500B\u6280\u80FD';
            this._body.appendChild(note);
      }

      toggle(): void { this._visible ? this.hide() : this.show(); }
      show(): void { this._visible = true; this._el.style.display = 'block'; this._renderContent(); }
      hide(): void { this._visible = false; this._el.style.display = 'none'; }
      dispose(): void { this._el.remove(); }
}
