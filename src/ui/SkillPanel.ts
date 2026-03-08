import { SKILL_DEFS, type SkillDef } from '../combat/CombatSystem';
import type { SkillBar } from './SkillBar';
import type { PetManager } from '../pets/PetManager';
import { PET_DEFS, SERIES_COLORS } from '../pets/PetData';
import { getRuntimeSkillDetail, getRuntimeSkillUpgradeMeta, resolveRuntimeSkillTuning } from '../data/runtime/RuntimeProgression';

type SkillTab = 'player' | 'pet';

const SKILL_TYPE_COLORS: Record<SkillDef['type'], string> = {
      attack: '#E74C3C',
      heal: '#27AE60',
      buff: '#3498DB',
      debuff: '#9B59B6',
};

const SKILL_TYPE_LABELS: Record<SkillDef['type'], string> = {
      attack: '攻擊',
      heal: '治療',
      buff: '增益',
      debuff: '減益',
};

/**
 * SkillPanel - player/pet skill management panel.
 */
export class SkillPanel {
      readonly panelId = 'skill';
      private _el: HTMLDivElement;
      private _visible = false;
      private _skillBar: SkillBar;
      private _petManager: PetManager | null = null;
      private _body!: HTMLDivElement;
      private _activeTab: SkillTab = 'player';
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
            this._el.className = 'sa-panel skill-panel ui-panel-fullscreen';
            this._el.hidden = true;

            this._buildShell();
            document.getElementById('ui-layer')?.appendChild(this._el);
            window.addEventListener('resize', this._onResize);
      }

      get isVisible(): boolean { return this._visible; }

      setPetManager(pm: PetManager): void {
            this._petManager = pm;
      }

      private _buildShell(): void {
            const title = document.createElement('div');
            title.className = 'sa-panel-title';
            title.textContent = '技能設定';

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
            this._body.className = 'panel-body skill-panel-body';
            this._el.appendChild(this._body);
      }

      private _switchTab(tab: SkillTab): void {
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
            if (this._el.classList.contains('ui-panel-fullscreen')) {
                  this._el.style.removeProperty('transform');
                  this._el.style.removeProperty('transform-origin');
                  return;
            }
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
            equipLabel.textContent = focusMode ? '技能欄（拖放）' : '技能欄位（拖放裝備，點擊可清除）';
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
            allLabel.textContent = focusMode ? '可用技能（點擊裝備）' : '技能清單（點擊裝備；升級可提高倍率）';
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
            const level = this._skillLevels.get(baseSkill.id) ?? 1;
            const upgradeMeta = getRuntimeSkillUpgradeMeta(baseSkill.id, level);
            const safeLevel = Math.min(level, Math.max(1, upgradeMeta.maxLevel));
            const skill = this._runtimeSkill(baseSkill);
            const runtimeDetail = getRuntimeSkillDetail(baseSkill.id, safeLevel);
            const focusMode = this._isLandscapeFocusMode();
            const isMaxed = safeLevel >= upgradeMeta.maxLevel;
            const upgradeCost = Math.max(1, upgradeMeta.nextUpgradeSp);
            const canUpgrade = !isMaxed && this._sp >= upgradeCost;

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
            name.innerHTML = `${skill.name} <span class="skill-card-level">Lv.${safeLevel}/${upgradeMeta.maxLevel}</span>`;

            const stats = document.createElement('div');
            stats.className = 'skill-card-stats';
            const type = document.createElement('span');
            type.className = 'skill-card-type';
            type.textContent = SKILL_TYPE_LABELS[baseSkill.type] ?? baseSkill.type;
            type.style.color = SKILL_TYPE_COLORS[baseSkill.type] ?? '#aaa';
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

            const effect = document.createElement('div');
            effect.className = 'skill-card-effect';
            effect.textContent = this._buildSkillEffectText(baseSkill, skill, runtimeDetail?.continuityTime ?? 0);

            const runtimeMeta = document.createElement('div');
            runtimeMeta.className = 'skill-card-runtime';
            runtimeMeta.textContent = this._buildRuntimeMetaText(runtimeDetail);

            info.appendChild(name);
            info.appendChild(stats);
            info.appendChild(mult);
            info.appendChild(effect);
            info.appendChild(runtimeMeta);

            const upBtn = document.createElement('button');
            upBtn.className = 'btn-gold skill-up-btn';
            if (isMaxed) {
                  upBtn.textContent = focusMode ? '已滿' : '已滿級';
                  upBtn.title = '已達最高等級';
            } else if (canUpgrade) {
                  upBtn.textContent = focusMode ? '升級' : `升級 -${upgradeCost}SP`;
                  upBtn.title = `消耗 ${upgradeCost} SP 升級技能`;
            } else {
                  upBtn.textContent = focusMode ? '不足' : `SP不足（需${upgradeCost}）`;
                  upBtn.title = `SP 不足，需 ${upgradeCost} 點`;
            }
            upBtn.disabled = !canUpgrade;
            upBtn.classList.toggle('is-disabled', !canUpgrade);
            upBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  this._upgradeSkill(baseSkill.id);
            });

            card.appendChild(icon);
            card.appendChild(info);
            card.appendChild(upBtn);
            return card;
      }

      private _buildSkillEffectText(baseSkill: SkillDef, tunedSkill: SkillDef, continuityMs: number): string {
            const durationSec = continuityMs > 0 ? Math.max(0.1, continuityMs / 1000) : 0;
            switch (baseSkill.type) {
                  case 'heal':
                        return durationSec > 0
                              ? `效果：恢復生命（持續 ${durationSec.toFixed(1)} 秒）`
                              : '效果：恢復生命';
                  case 'buff':
                        return durationSec > 0
                              ? `效果：增益強化（持續 ${durationSec.toFixed(1)} 秒）`
                              : '效果：增益強化';
                  case 'debuff':
                        return durationSec > 0
                              ? `效果：削弱敵方（持續 ${durationSec.toFixed(1)} 秒）`
                              : '效果：削弱敵方';
                  default:
                        return `效果：造成約 ${tunedSkill.multiplier.toFixed(2)} 倍傷害`;
            }
      }

      private _buildRuntimeMetaText(
            detail: ReturnType<typeof getRuntimeSkillDetail> | null,
      ): string {
            if (!detail) return '資料：未接入 runtime 詳細參數';
            const target = this._formatTargetClass(detail.targetClass);
            const range = detail.maxTargetDistance > 0 ? `距離 ${detail.maxTargetDistance}` : '距離 -';
            const area = detail.targetRange > 0 ? `範圍 ${detail.targetRange}` : '單體';
            const duration = detail.continuityTime > 0 ? `持續 ${(detail.continuityTime / 1000).toFixed(1)}s` : '瞬發';
            const polarity = detail.positiveEffect ? '增益' : '減益';
            const stat = this._formatEffectStat(detail.effectingStat);
            const shape = detail.targetRangeClass > 0 ? `範圍類型 ${detail.targetRangeClass}` : '範圍類型 0';
            return `目標 ${target} · ${range} · ${area} · ${duration} · ${polarity}/${stat} · ${shape}`;
      }

      private _formatTargetClass(raw: string | null): string {
            const v = String(raw ?? '').trim();
            if (!v) return '一般';
            if (/^t0+1$/.test(v)) return '敵方單體';
            if (/^t1+0+$/.test(v)) return '我方/友方';
            if (v === 't1111110') return '敵方範圍';
            if (v === 't1111000') return '我方範圍';
            return v;
      }

      private _formatEffectStat(code: number): string {
            switch (code) {
                  case 1: return 'HP';
                  case 2: return 'MP';
                  case 3: return '攻擊';
                  case 4: return '防禦';
                  case 5: return '力量';
                  case 6: return '敏捷';
                  case 7: return '命中';
                  case 8: return '幸運';
                  default: return `屬性${code}`;
            }
      }

      private _upgradeSkill(skillId: string): void {
            const curr = this._skillLevels.get(skillId) ?? 1;
            const upgradeMeta = getRuntimeSkillUpgradeMeta(skillId, curr);
            if (curr >= upgradeMeta.maxLevel) return;

            const cost = Math.max(1, upgradeMeta.nextUpgradeSp);
            if (this._sp < cost) return;

            this._sp -= cost;
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
            const tuned = resolveRuntimeSkillTuning(base.id, level, base);
            const safeLevel = Math.min(level, Math.max(1, tuned.maxLevel));
            const multBonus = 1 + (safeLevel - 1) * 0.08;
            return {
                  ...base,
                  name: tuned.runtimeName ?? base.name,
                  mpCost: tuned.mpCost,
                  cooldown: tuned.cooldown,
                  multiplier: Number((base.multiplier * multBonus).toFixed(2)),
            };
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
                        const atkType = pet.def.attackType === 'melee' ? '近戰' : '遠程';
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
            this._el.hidden = false;
            this._renderContent();
      }

      hide(): void {
            this._visible = false;
            this._el.hidden = true;
      }

      dispose(): void {
            window.removeEventListener('resize', this._onResize);
            this._el.remove();
      }
}
