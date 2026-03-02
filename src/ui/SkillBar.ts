import { SKILL_DEFS, type SkillDef } from '../combat/CombatSystem';
import type { PetManager } from '../pets/PetManager';
import { PET_DEFS, SERIES_ICONS, type PetSkillDef, type PetSeries } from '../pets/PetData';

/**
 * SkillBar — Right-side vertical bar split into:
 *   Top: "角色技能" label + 5 player skill slots (F1-F5)
 *   Bottom: "寵物技能" label + 3 pet skill slots (auto from active pets)
 */
export class SkillBar {
      private _el: HTMLDivElement;
      private _playerSlots: SkillSlot[] = [];
      private _petSlots: SkillSlot[] = [];
      private _collapsed = false;
      private _petManager: PetManager | null = null;

      /** Currently equipped player skills (5 slots) */
      private _equipped: (SkillDef | null)[] = [];

      constructor() {
            const uiLayer = document.getElementById('ui-layer')!;

            // Default: first 5 skills equipped
            for (let i = 0; i < 5; i++) {
                  this._equipped.push(SKILL_DEFS[i] ?? null);
            }

            this._el = document.createElement('div');
            this._el.id = 'skillBar';
            this._el.className = 'interactive';
            Object.assign(this._el.style, {
                  position: 'fixed', right: '4px', top: '76px', zIndex: '150',
                  display: 'flex', flexDirection: 'column', gap: '2px',
                  background: 'linear-gradient(180deg, rgba(20,16,30,0.85), rgba(12,10,20,0.9))',
                  border: '1px solid rgba(160,130,80,0.25)',
                  borderRadius: '6px', padding: '4px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
            });

            // Toggle header
            const toggle = document.createElement('div');
            toggle.style.cssText = 'font-size:9px;color:rgba(232,201,106,0.6);text-align:center;cursor:pointer;padding:2px';
            toggle.textContent = '\u25BC Skills';
            toggle.addEventListener('click', () => {
                  this._collapsed = !this._collapsed;
                  const display = this._collapsed ? 'none' : '';
                  this._playerSlots.forEach(s => s.el.style.display = display);
                  this._petSlots.forEach(s => s.el.style.display = display);
                  this._el.querySelectorAll('.skillbar-label,.skillbar-divider').forEach(
                        el => (el as HTMLElement).style.display = display
                  );
                  toggle.textContent = this._collapsed ? '\u25B6 Skills' : '\u25BC Skills';
            });
            this._el.appendChild(toggle);

            // ── Player Skills Section ──
            const playerLabel = document.createElement('div');
            playerLabel.className = 'skillbar-label';
            playerLabel.textContent = '\u2694 \u89D2\u8272';
            this._el.appendChild(playerLabel);

            // 5 player skill slots
            for (let i = 0; i < 5; i++) {
                  const slot = new SkillSlot(i, `F${i + 1}`, this._equipped[i], () => this._onPlayerSlotClick(i));
                  this._el.appendChild(slot.el);
                  this._playerSlots.push(slot);
            }

            // ── Divider ──
            const divider = document.createElement('div');
            divider.className = 'skillbar-divider';
            this._el.appendChild(divider);

            // ── Pet Skills Section ──
            const petLabel = document.createElement('div');
            petLabel.className = 'skillbar-label';
            petLabel.textContent = '\uD83D\uDC3E \u5BF5\u7269';
            this._el.appendChild(petLabel);

            // 3 pet skill slots (auto-filled)
            for (let i = 0; i < 3; i++) {
                  const slot = new SkillSlot(i + 5, `P${i + 1}`, null, () => { });
                  slot.el.classList.add('pet-skill-slot');
                  this._el.appendChild(slot.el);
                  this._petSlots.push(slot);
            }

            // Keyboard hotkeys (F1-F5 for player skills)
            window.addEventListener('keydown', (e) => {
                  const match = e.key.match(/^F(\d)$/);
                  if (match) {
                        const idx = parseInt(match[1]) - 1;
                        if (idx >= 0 && idx < 5) {
                              e.preventDefault();
                              this._onPlayerSlotClick(idx);
                        }
                  }
            });

            uiLayer.appendChild(this._el);
      }

      setPetManager(pm: PetManager): void {
            this._petManager = pm;
      }

      private _onPlayerSlotClick(idx: number): void {
            const skill = this._equipped[idx];
            if (!skill) return;
            const slot = this._playerSlots[idx];
            if (slot.isOnCooldown) return;
            slot.startCooldown(skill.cooldown);
            slot.flashPress();
            console.log('[Skill] Cast:', skill.name, `(F${idx + 1})`);
      }

      /** Update CD overlays + refresh pet slots each frame */
      update(dt: number): void {
            for (const slot of this._playerSlots) {
                  slot.update(dt);
            }
            for (const slot of this._petSlots) {
                  slot.update(dt);
            }
            // Refresh pet skill icons from active pets
            this._refreshPetSlots();
      }

      private _refreshPetSlots(): void {
            if (!this._petManager) return;
            const activePets = this._petManager.active;
            for (let i = 0; i < 3; i++) {
                  const slot = this._petSlots[i];
                  if (i < activePets.length) {
                        const pet = activePets[i];
                        const petDef = PET_DEFS.find(d => d.id === pet.def.id);
                        const skill = petDef?.skills?.[0];
                        slot.setPetSkill(pet.def.name, skill ?? null, pet.def.series);
                  } else {
                        slot.setPetSkill(null, null, undefined);
                  }
            }
      }

      /** Set auto-cast glow on a player slot */
      setAutoCast(idx: number, enabled: boolean): void {
            if (idx >= 0 && idx < 5) {
                  this._playerSlots[idx].setAutoCast(enabled);
            }
      }

      /** Set player skill at a slot index */
      setSkill(idx: number, skill: SkillDef | null): void {
            if (idx >= 0 && idx < 5) {
                  this._equipped[idx] = skill;
                  this._playerSlots[idx].setPlayerSkill(skill);
            }
      }

      /** Get currently equipped player skills */
      getEquipped(): (SkillDef | null)[] {
            return [...this._equipped];
      }

      /** Trigger CD animation on a player slot (called by CombatLoop) */
      triggerPlayerCD(idx: number, duration: number): void {
            if (idx >= 0 && idx < 5) {
                  this._playerSlots[idx].startCooldown(duration);
                  this._playerSlots[idx].flashPress();
            }
      }

      /** Trigger CD animation on a pet slot (called by CombatLoop) */
      triggerPetCD(idx: number, duration: number): void {
            if (idx >= 0 && idx < 3) {
                  this._petSlots[idx].startCooldown(duration);
                  this._petSlots[idx].flashPress();
            }
      }

      dispose(): void { this._el.remove(); }
}

/**
 * Individual skill slot with icon + CD overlay + timer text + auto-cast glow
 */
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

            // Icon area
            this._iconEl = document.createElement('div');
            this._iconEl.className = 'skill-icon';
            if (skill) {
                  this._iconEl.style.backgroundImage = `url(assets/icons/${skill.icon})`;
                  this._iconEl.title = `${skill.name} (MP:${skill.mpCost} CD:${skill.cooldown}s)`;
            }
            this.el.appendChild(this._iconEl);

            // CD overlay (conic-gradient mask)
            this._cdOverlay = document.createElement('div');
            this._cdOverlay.className = 'skill-cd-overlay';
            this._cdOverlay.style.display = 'none';
            this.el.appendChild(this._cdOverlay);

            // CD timer text (remaining seconds)
            this._cdText = document.createElement('span');
            this._cdText.className = 'skill-cd-text';
            this._cdText.style.display = 'none';
            this.el.appendChild(this._cdText);

            // Pet name label (bottom, only for pet slots)
            this._nameEl = document.createElement('span');
            this._nameEl.className = 'skill-pet-name';
            this._nameEl.style.display = 'none';
            this.el.appendChild(this._nameEl);

            // Key label
            const kl = document.createElement('span');
            kl.className = 'skill-key-label';
            kl.textContent = keyLabel;
            this.el.appendChild(kl);
      }

      get isOnCooldown(): boolean { return this._cooldown > 0; }

      startCooldown(duration: number): void {
            this._cooldown = duration;
            this._maxCooldown = duration;
            this._cdOverlay.style.display = 'block';
            this._cdText.style.display = 'block';
            this._iconEl.style.filter = 'brightness(0.4)';
      }

      update(dt: number): void {
            if (this._cooldown <= 0) return;
            this._cooldown -= dt;
            if (this._cooldown <= 0) {
                  this._cooldown = 0;
                  this._cdOverlay.style.display = 'none';
                  this._cdText.style.display = 'none';
                  this._iconEl.style.filter = '';
                  // Flash green when ready
                  this.el.style.boxShadow = '0 0 8px rgba(39,174,96,0.6)';
                  setTimeout(() => { this.el.style.boxShadow = ''; }, 400);
                  return;
            }
            const pct = this._cooldown / this._maxCooldown;
            const deg = pct * 360;
            this._cdOverlay.style.background =
                  `conic-gradient(rgba(0,0,0,0.7) ${deg}deg, transparent ${deg}deg)`;
            this._cdText.textContent = this._cooldown.toFixed(1);
      }

      setAutoCast(enabled: boolean): void {
            this.el.classList.toggle('auto-cast', enabled);
      }

      setPlayerSkill(skill: SkillDef | null): void {
            if (skill) {
                  this._iconEl.style.backgroundImage = `url(assets/icons/${skill.icon})`;
                  this._iconEl.title = `${skill.name} (MP:${skill.mpCost} CD:${skill.cooldown}s)`;
            } else {
                  this._iconEl.style.backgroundImage = 'none';
                  this._iconEl.title = '';
            }
      }

      /** Update pet slot: show series icon + pet name + skill tooltip */
      setPetSkill(petName: string | null, skill: PetSkillDef | null, series?: PetSeries): void {
            if (petName && this._petName === petName) return; // no change
            this._petName = petName;
            if (petName && skill) {
                  // Use series icon
                  const iconFile = series !== undefined ? SERIES_ICONS[series] : '';
                  if (iconFile) {
                        this._iconEl.style.backgroundImage = `url(assets/icons/${iconFile})`;
                        this._iconEl.style.background = '';
                        this._iconEl.style.backgroundImage = `url(assets/icons/${iconFile})`;
                        this._iconEl.style.backgroundSize = 'cover';
                        this._iconEl.style.backgroundPosition = 'center';
                  } else {
                        this._iconEl.style.backgroundImage = 'none';
                        this._iconEl.style.background = 'radial-gradient(circle, rgba(232,201,106,0.3), rgba(20,16,30,0.8))';
                  }
                  this._iconEl.title = `${petName}: ${skill.name} (DMG:${skill.damage} CD:${skill.cooldown}s)`;
                  this._nameEl.textContent = petName.substring(0, 3);
                  this._nameEl.style.display = 'block';
            } else {
                  this._iconEl.style.backgroundImage = 'none';
                  this._iconEl.style.background = 'rgba(30,25,40,0.5)';
                  this._iconEl.title = '';
                  this._nameEl.style.display = 'none';
            }
      }

      flashPress(): void {
            this.el.style.transform = 'scale(0.88)';
            setTimeout(() => { this.el.style.transform = ''; }, 100);
      }
}
