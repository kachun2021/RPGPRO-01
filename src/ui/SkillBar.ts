import { SKILL_DEFS, type SkillDef } from '../combat/CombatSystem';
import type { PetManager } from '../pets/PetManager';
import { PET_DEFS, SERIES_ICONS, type PetSeries, type PetSkillDef } from '../pets/PetData';

/**
 * SkillBar
 * - Top: player skills F1-F5
 * - Bottom: pet skills P1-P3
 */
export class SkillBar {
      private _el: HTMLDivElement;
      private _playerSlots: SkillSlot[] = [];
      private _petSlots: SkillSlot[] = [];
      private _collapsed = false;
      private _petManager: PetManager | null = null;
      private _globalPlayerLock = 0;
      private _equipped: (SkillDef | null)[] = [];
      private _toggleBtn: HTMLDivElement;
      private _petRefreshCountdown = 0;
      private readonly PET_REFRESH_INTERVAL = 0.25;

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            for (let i = 0; i < 5; i++) this._equipped.push(SKILL_DEFS[i] ?? null);

            this._el = document.createElement('div');
            this._el.id = 'skillBar';
            this._el.className = 'skillbar-root interactive';

            this._toggleBtn = document.createElement('div');
            this._toggleBtn.className = 'skillbar-toggle';
            this._toggleBtn.textContent = '▼ Skills';
            this._toggleBtn.addEventListener('mouseenter', () => this._toggleBtn.classList.add('is-hover'));
            this._toggleBtn.addEventListener('mouseleave', () => this._toggleBtn.classList.remove('is-hover'));
            this._toggleBtn.addEventListener('click', () => this._toggleCollapse());
            this._el.appendChild(this._toggleBtn);

            const playerLabel = document.createElement('div');
            playerLabel.className = 'skillbar-label';
            playerLabel.textContent = '⚔️ 角色';
            this._el.appendChild(playerLabel);

            for (let i = 0; i < 5; i++) {
                  const slot = new SkillSlot(i, `F${i + 1}`, this._equipped[i], () => this._onPlayerSlotClick(i));
                  this._el.appendChild(slot.el);
                  this._playerSlots.push(slot);
            }

            const divider = document.createElement('div');
            divider.className = 'skillbar-divider';
            this._el.appendChild(divider);

            const petLabel = document.createElement('div');
            petLabel.className = 'skillbar-label';
            petLabel.textContent = '🐾 寵物';
            this._el.appendChild(petLabel);

            for (let i = 0; i < 3; i++) {
                  const slot = new SkillSlot(i + 5, `P${i + 1}`, null, () => { });
                  slot.el.classList.add('pet-skill-slot');
                  this._el.appendChild(slot.el);
                  this._petSlots.push(slot);
            }

            window.addEventListener('keydown', (e) => {
                  const match = e.key.match(/^F(\d{1,2})$/);
                  if (!match) return;
                  const idx = parseInt(match[1], 10) - 1;
                  if (idx < 0 || idx >= 8) return;
                  e.preventDefault();
                  if (idx < 5) this._onPlayerSlotClick(idx);
                  else this._onPetSlotHotkey(idx - 5);
            });

            uiLayer.appendChild(this._el);
      }

      setPetManager(pm: PetManager): void {
            this._petManager = pm;
      }

      private _toggleCollapse(): void {
            this._collapsed = !this._collapsed;
            this._el.classList.toggle('is-collapsed', this._collapsed);
            this._toggleBtn.textContent = this._collapsed ? '▶ Skills' : '▼ Skills';
      }

      private _onPlayerSlotClick(idx: number): void {
            const skill = this._equipped[idx];
            if (!skill) return;
            if (this._globalPlayerLock > 0) return;
            const slot = this._playerSlots[idx];
            if (slot.isOnCooldown) return;
            slot.startCooldown(skill.cooldown);
            slot.flashPress();
            this._globalPlayerLock = skill.cooldown;
      }

      private _onPetSlotHotkey(idx: number): void {
            if (idx < 0 || idx >= this._petSlots.length) return;
            this._petSlots[idx].flashPress();
      }

      update(dt: number): void {
            this._globalPlayerLock = Math.max(0, this._globalPlayerLock - dt);
            this._playerSlots.forEach((slot) => slot.update(dt));
            this._petSlots.forEach((slot) => slot.update(dt));
            this._petRefreshCountdown = Math.max(0, this._petRefreshCountdown - dt);
            if (this._petRefreshCountdown <= 0) {
                  this._petRefreshCountdown = this.PET_REFRESH_INTERVAL;
                  this._refreshPetSlots();
            }
      }

      private _refreshPetSlots(): void {
            if (!this._petManager) return;
            const activePets = this._petManager.active;
            for (let i = 0; i < 3; i++) {
                  const slot = this._petSlots[i];
                  if (i < activePets.length) {
                        const pet = activePets[i];
                        const petDef = PET_DEFS.find((d) => d.id === pet.def.id);
                        const skill = petDef?.skills?.[0];
                        slot.setPetSkill(pet.def.name, skill ?? null, pet.def.series);
                  } else {
                        slot.setPetSkill(null, null, undefined);
                  }
            }
      }

      setAutoCast(idx: number, enabled: boolean): void {
            if (idx >= 0 && idx < 5) this._playerSlots[idx].setAutoCast(enabled);
      }

      setSkill(idx: number, skill: SkillDef | null): void {
            if (idx >= 0 && idx < 5) {
                  this._equipped[idx] = skill;
                  this._playerSlots[idx].setPlayerSkill(skill);
            }
      }

      setPlayerLoadout(skillIds: string[]): void {
            const next = skillIds
                  .map((skillId) => SKILL_DEFS.find((skill) => skill.id === skillId) ?? null)
                  .filter((skill): skill is SkillDef => !!skill)
                  .slice(0, 5);

            for (let i = 0; i < 5; i++) {
                  this.setSkill(i, next[i] ?? null);
            }
      }

      getEquipped(): (SkillDef | null)[] {
            return [...this._equipped];
      }

      triggerPlayerCD(idx: number, duration: number): void {
            if (idx < 0 || idx >= 5) return;
            this._globalPlayerLock = duration;
            this._playerSlots[idx].startCooldown(duration);
            this._playerSlots[idx].flashPress();
      }

      triggerPetCD(idx: number, duration: number): void {
            if (idx < 0 || idx >= 3) return;
            this._petSlots[idx].startCooldown(duration);
            this._petSlots[idx].flashPress();
      }

      dispose(): void {
            this._el.remove();
      }
}

class SkillSlot {
      public el: HTMLDivElement;
      private _iconEl: HTMLDivElement;
      private _cdOverlay: HTMLDivElement;
      private _cdText: HTMLSpanElement;
      private _nameEl: HTMLSpanElement;
      private _cooldown = 0;
      private _maxCooldown = 0;
      private _petName: string | null = null;

      constructor(index: number, keyLabel: string, skill: SkillDef | null, onClick: () => void) {
            this.el = document.createElement('div');
            this.el.className = 'skill-slot';
            this.el.addEventListener('click', onClick);

            this._iconEl = document.createElement('div');
            this._iconEl.className = 'skill-icon';
            this.el.appendChild(this._iconEl);

            this._cdOverlay = document.createElement('div');
            this._cdOverlay.className = 'skill-cd-overlay';
            this.el.appendChild(this._cdOverlay);

            this._cdText = document.createElement('span');
            this._cdText.className = 'skill-cd-text';
            this.el.appendChild(this._cdText);

            this._nameEl = document.createElement('span');
            this._nameEl.className = 'skill-pet-name';
            this.el.appendChild(this._nameEl);

            const key = document.createElement('span');
            key.className = 'skill-key-label';
            key.textContent = keyLabel;
            this.el.appendChild(key);

            this.setPlayerSkill(skill);
      }

      get isOnCooldown(): boolean { return this._cooldown > 0; }

      startCooldown(duration: number): void {
            this._cooldown = duration;
            this._maxCooldown = duration;
            this.el.classList.add('is-on-cooldown');
            this._cdText.textContent = duration.toFixed(1);
            this.el.style.setProperty('--skill-cd-deg', '360deg');
      }

      update(dt: number): void {
            if (this._cooldown <= 0) return;
            this._cooldown -= dt;
            if (this._cooldown <= 0) {
                  this._cooldown = 0;
                  this.el.classList.remove('is-on-cooldown');
                  this._cdText.textContent = '';
                  this.el.style.removeProperty('--skill-cd-deg');
                  this.el.classList.add('is-ready-flash');
                  setTimeout(() => this.el.classList.remove('is-ready-flash'), 400);
                  return;
            }
            const pct = this._cooldown / this._maxCooldown;
            const deg = pct * 360;
            this.el.style.setProperty('--skill-cd-deg', `${deg}deg`);
            this._cdText.textContent = this._cooldown.toFixed(1);
      }

      setAutoCast(enabled: boolean): void {
            this.el.classList.toggle('auto-cast', enabled);
      }

      setPlayerSkill(skill: SkillDef | null): void {
            this._petName = null;
            this.el.classList.remove('has-pet-name');
            this._nameEl.textContent = '';
            if (skill) {
                  this._setIconImage(skill.icon);
                  this._iconEl.title = `${skill.name} (MP:${skill.mpCost} CD:${skill.cooldown}s)`;
                  this.el.classList.remove('is-empty');
            } else {
                  this._setIconImage(null);
                  this._iconEl.title = '';
                  this.el.classList.add('is-empty');
            }
      }

      setPetSkill(petName: string | null, skill: PetSkillDef | null, series?: PetSeries): void {
            if (petName && this._petName === petName) return;
            this._petName = petName;
            if (petName && skill) {
                  const iconFile = series !== undefined ? SERIES_ICONS[series] : '';
                  this._setIconImage(iconFile || null);
                  this._iconEl.title = `${petName}: ${skill.name} (DMG:${skill.damage} CD:${skill.cooldown}s)`;
                  this._nameEl.textContent = petName.substring(0, 3);
                  this.el.classList.add('has-pet-name');
                  this.el.classList.remove('is-empty');
            } else {
                  this._setIconImage(null);
                  this._iconEl.title = '';
                  this._nameEl.textContent = '';
                  this.el.classList.remove('has-pet-name');
                  this.el.classList.add('is-empty');
            }
      }

      flashPress(): void {
            this.el.classList.add('is-pressed');
            setTimeout(() => this.el.classList.remove('is-pressed'), 120);
      }

      private _setIconImage(icon: string | null): void {
            if (icon) {
                  this.el.style.setProperty('--skill-icon-url', `url("assets/icons/${icon}")`);
            } else {
                  this.el.style.removeProperty('--skill-icon-url');
            }
      }
}
