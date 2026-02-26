import { Scene } from "@babylonjs/core/scene";
import { Player, PlayerStats, EquipmentSlots } from "../entities/Player";

/**
 * Premium DOM-based Character Panel — Dark Abyss Theme
 * Full-screen overlay with Glassmorphism and CSS animations
 */
export class CharacterPanel {
    private isOpen = false;
    private container: HTMLElement;
    private rootDiv: HTMLElement;

    // Dynamic text elements
    private levelText!: HTMLElement;
    private hpText!: HTMLElement;
    private mpText!: HTMLElement;
    private staText!: HTMLElement;
    private atkText!: HTMLElement;
    private defText!: HTMLElement;
    private expText!: HTMLElement;
    private expFill!: HTMLElement;

    private helmetSlotText!: HTMLElement;
    private armorSlotText!: HTMLElement;
    private weaponSlotText!: HTMLElement;
    private accessorySlotText!: HTMLElement;

    constructor(private scene: Scene, private player: Player) {
        this.container = document.getElementById("ui-layer") || document.body;
        this.injectCSS();

        this.rootDiv = document.createElement("div");
        this.rootDiv.className = "char-panel-root";
        this.container.appendChild(this.rootDiv);

        this.buildDOM();
        this.bindPlayerData();
        this.hide(); // Start hidden
    }

    private injectCSS() {
        if (document.getElementById("char-styles")) return;
        const style = document.createElement("style");
        style.id = "char-styles";
        style.textContent = `
            .char-panel-root { position: absolute; inset: 0; display: flex; justify-content: flex-end; align-items: center; pointer-events: none; z-index: 50; transition: background 0.3s; font-family: 'Inter', sans-serif;}
            .char-panel-root.open { pointer-events: auto; background: rgba(2, 2, 6, 0.82); }
            
            .char-container { width: 90%; max-width: 400px; height: 88%; margin-right: 5%; background: rgba(10, 10, 16, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(120, 90, 255, 0.25); border-radius: 24px; box-shadow: -8px 0 32px rgba(0,0,0,0.5); display: flex; flex-direction: column; transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1); position: relative; overflow: hidden; }
            .char-panel-root.open .char-container { transform: translateX(0); }
            
            .char-header { height: 80px; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, rgba(120, 90, 255, 0.1) 0%, transparent 100%); border-bottom: 1px solid rgba(120, 90, 255, 0.2); }
            .char-title { font-family: 'Cinzel', serif; font-size: 26px; font-weight: 700; color: #e2e8f0; text-shadow: 0 2px 4px rgba(0,0,0,0.8); letter-spacing: 2px;}
            
            .char-content { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
            .char-content::-webkit-scrollbar { width: 0; }
            
            .preview-area { background: rgba(6, 6, 12, 0.6); border: 1px solid rgba(120, 90, 255, 0.15); border-radius: 16px; padding: 16px; position: relative; display: flex; align-items: center; gap: 16px;}
            .preview-avatar { width: 80px; height: 80px; border-radius: 50%; background: rgba(14, 10, 28, 0.95); border: 2px solid rgba(168, 85, 247, 0.6); display: flex; justify-content: center; align-items: center; font-size: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
            .preview-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
            .preview-name { font-size: 22px; font-weight: 700; color: #e2e8f0; }
            .preview-class { font-size: 13px; color: rgba(255,255,255,0.5); }
            .preview-lvl { font-size: 18px; font-weight: 700; color: #c084fc; margin-top: 4px;}
            
            .char-exp-box { margin-top: 12px; background: rgba(6,4,14,0.7); border-radius: 8px; border: 1px solid rgba(120,90,255,0.15); height: 16px; position: relative; overflow: hidden; width: 100%;}
            .char-exp-fill { height: 100%; background: #c084fc; width: 0%; transition: width 0.3s; }
            .char-exp-txt { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; font-size: 10px; font-weight: 600; color: #fff; text-shadow: 0 1px 2px #000; }
            
            .stats-section { background: rgba(6, 6, 12, 0.6); border: 1px solid rgba(120, 90, 255, 0.15); border-radius: 16px; padding: 16px; }
            .section-title { font-size: 15px; font-weight: 700; color: #e2e8f0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;}
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .stat-item { font-size: 14px; font-weight: 600; }
            .c-hp { color: #ef4444; } .c-mp { color: #818cf8; } .c-sta { color: #c084fc; } .c-atk { color: #f87171; } .c-def { color: #e2e8f0; }
            
            .equip-section { background: rgba(6, 6, 12, 0.6); border: 1px solid rgba(120, 90, 255, 0.15); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 10px;}
            .equip-slot { background: rgba(14, 12, 28, 0.7); border: 1px solid rgba(120, 90, 255, 0.1); border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; }
            .equip-icon { font-size: 24px; }
            .equip-details { flex: 1; display: flex; flex-direction: column; }
            .equip-label { font-size: 11px; color: rgba(148,163,184,0.6); text-transform: uppercase; }
            .equip-name { font-size: 15px; font-weight: 600; color: #e2e8f0; margin-top: 2px; }
            
            .swap-btn { padding: 6px 12px; background: rgba(168, 85, 247, 0.15); border: 1px solid #a855f7; border-radius: 6px; color: #a855f7; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s;}
            .swap-btn:active { transform: scale(0.95); background: rgba(168,85,247,0.3); }
            
            .close-btn { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); padding: 12px 32px; background: rgba(120, 90, 255, 0.15); border: 1px solid rgba(255,255,255,0.2); border-radius: 24px; color: #fff; font-weight: 700; font-size: 14px; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(10px);}
            .close-btn:active { transform: translateX(-50%) scale(0.95); background: rgba(120,90,255,0.3); }
        `;
        document.head.appendChild(style);
    }

    private buildDOM() {
        this.rootDiv.innerHTML = `
            <div class="char-container">
                <div class="char-header"><div class="char-title">CHARACTER</div></div>
                
                <div class="char-content">
                    <div class="preview-area">
                        <div class="preview-avatar">👤</div>
                        <div class="preview-info">
                            <div class="preview-name">Wanderer</div>
                            <div class="preview-class">Exploration Vanguard</div>
                            <div class="preview-lvl" id="char-lvl">Lv.1</div>
                            <div class="char-exp-box">
                                <div class="char-exp-fill" id="char-exp-fill"></div>
                                <div class="char-exp-txt" id="char-exp-txt">EXP 0 / 1000</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <div class="section-title">Combat Stats</div>
                        <div class="stats-grid">
                            <div class="stat-item c-hp" id="char-hp">HP: ---</div>
                            <div class="stat-item c-mp" id="char-mp">MP: ---</div>
                            <div class="stat-item c-sta" id="char-sta">STA: ---</div>
                            <div class="stat-item c-atk" id="char-atk">ATK: ---</div>
                            <div class="stat-item c-def" id="char-def">DEF: ---</div>
                        </div>
                    </div>
                    
                    <div class="equip-section">
                        <div class="section-title">Equipment</div>
                        
                        <div class="equip-slot">
                            <div class="equip-icon">⛑</div>
                            <div class="equip-details">
                                <div class="equip-label">Helmet</div>
                                <div class="equip-name" id="char-eq-helm">---</div>
                            </div>
                            <button class="swap-btn" id="btn-swap-helm">⟲ Swap</button>
                        </div>
                        
                        <div class="equip-slot">
                            <div class="equip-icon">🛡</div>
                            <div class="equip-details">
                                <div class="equip-label">Armor</div>
                                <div class="equip-name" id="char-eq-armor">---</div>
                            </div>
                        </div>
                        
                        <div class="equip-slot">
                            <div class="equip-icon">⚔</div>
                            <div class="equip-details">
                                <div class="equip-label">Weapon</div>
                                <div class="equip-name" id="char-eq-wpn">---</div>
                            </div>
                        </div>
                        
                        <div class="equip-slot">
                            <div class="equip-icon">💍</div>
                            <div class="equip-details">
                                <div class="equip-label">Accessory</div>
                                <div class="equip-name" id="char-eq-acc">---</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button class="close-btn" id="char-btn-close">✕ CLOSE</button>
            </div>
        `;

        this.levelText = document.getElementById("char-lvl")!;
        this.expText = document.getElementById("char-exp-txt")!;
        this.expFill = document.getElementById("char-exp-fill")!;
        this.hpText = document.getElementById("char-hp")!;
        this.mpText = document.getElementById("char-mp")!;
        this.staText = document.getElementById("char-sta")!;
        this.atkText = document.getElementById("char-atk")!;
        this.defText = document.getElementById("char-def")!;

        this.helmetSlotText = document.getElementById("char-eq-helm")!;
        this.armorSlotText = document.getElementById("char-eq-armor")!;
        this.weaponSlotText = document.getElementById("char-eq-wpn")!;
        this.accessorySlotText = document.getElementById("char-eq-acc")!;

        document.getElementById("char-btn-close")!.addEventListener("pointerdown", () => this.hide());

        // Background click to close
        this.rootDiv.addEventListener("pointerdown", (e) => {
            if (e.target === this.rootDiv) this.hide();
        });

        document.getElementById("btn-swap-helm")!.addEventListener("pointerdown", () => {
            const newHelmet = this.player.cycleHelmet();
            // Equipment will be implicitly Refreshed by the hook
        });
    }

    private bindPlayerData(): void {
        this.refreshStats(this.player.getStats());
        this.refreshEquipment(this.player.getEquipment());

        this.player.onStatsChanged.add((stats) => this.refreshStats(stats));
        this.player.onEquipmentChanged.add((equip) => this.refreshEquipment(equip));
    }

    private refreshStats(s: PlayerStats): void {
        if (!this.levelText) return;
        this.levelText.innerText = `Lv.${s.level}`;
        this.hpText.innerText = `HP: ${s.hp}/${s.maxHp}`;
        this.mpText.innerText = `MP: ${s.mp}/${s.maxMp}`;
        this.staText.innerText = `STA: ${s.stamina}/${s.maxStamina}`;
        this.atkText.innerText = `ATK: ${s.atk}`;
        this.defText.innerText = `DEF: ${s.def}`;
        this.expText.innerText = `EXP ${s.exp} / ${s.maxExp}`;
        this.expFill.style.width = `${Math.round((s.exp / s.maxExp) * 100)}%`;
    }

    private refreshEquipment(e: EquipmentSlots): void {
        if (!this.helmetSlotText) return;
        this.helmetSlotText.innerText = this.capitalize(e.helmet);
        this.armorSlotText.innerText = this.capitalize(e.armor.replace("_", " "));
        this.weaponSlotText.innerText = this.capitalize(e.weapon);
        this.accessorySlotText.innerText = this.capitalize(e.accessory.replace("_", " "));
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    public show(): void {
        this.isOpen = true;
        this.rootDiv.classList.add("open");
        this.refreshStats(this.player.getStats());
        this.refreshEquipment(this.player.getEquipment());
    }

    public hide(): void {
        this.isOpen = false;
        this.rootDiv.classList.remove("open");
    }

    public toggle(): void {
        if (this.isOpen) this.hide(); else this.show();
    }

    public getIsOpen(): boolean {
        return this.isOpen;
    }

    public dispose(): void {
        this.rootDiv.remove();
    }
}
