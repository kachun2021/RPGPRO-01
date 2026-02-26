import { Scene } from "@babylonjs/core/scene";
import { Observable } from "@babylonjs/core/Misc/observable";
import { PlayerStats } from "../entities/Player";

/**
 * Premium DOM-based HUD — Dark Abyss Theme
 * Responsive, 120 FPS UI rendering with CSS Glassmorphism
 */
export class HUD {
    public readonly onSkillUse = new Observable<string>();
    public readonly onAutoBattleToggle = new Observable<boolean>();

    public onCharacterButton: (() => void) | null = null;
    public onInventoryButton: (() => void) | null = null;
    public onShopButton: (() => void) | null = null;

    private container: HTMLElement;
    private rootDiv: HTMLElement;

    private hpFill!: HTMLElement;
    private mpFill!: HTMLElement;
    private expFill!: HTMLElement;
    private levelText!: HTMLElement;
    private goldText!: HTMLElement;
    private gemsText!: HTMLElement;
    private autoBtn!: HTMLElement;
    private autoActive = false;

    private skillCDOverlays = new Map<string, HTMLElement>();

    constructor(private scene: Scene) {
        this.container = document.getElementById("ui-layer") || document.body;
        this.injectCSS();
        this.rootDiv = document.createElement("div");
        this.rootDiv.className = "hud-root";
        this.container.appendChild(this.rootDiv);
        this.buildDOM();
    }

    private injectCSS() {
        if (document.getElementById("hud-styles")) return;
        const style = document.createElement("style");
        style.id = "hud-styles";
        style.textContent = `
            .hud-root { position: absolute; inset: 0; pointer-events: none; padding: env(safe-area-inset-top, 20px) env(safe-area-inset-right, 20px) env(safe-area-inset-bottom, 20px) env(safe-area-inset-left, 20px); font-family: 'Inter', sans-serif; overflow: hidden; z-index: 10; }
            .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; padding: 0 15px; }
            
            .avatar-panel { display: flex; align-items: center; gap: 12px; pointer-events: auto; padding: 6px 16px 6px 6px; border-radius: 40px; cursor: pointer; }
            .avatar-img { width: 50px; height: 50px; border-radius: 50%; background: rgba(14,10,28,0.9); border: 2px solid rgba(168,85,247,0.6); display: flex; justify-content: center; align-items: center; font-size: 24px; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
            .level-badge { position: absolute; bottom: -4px; right: -4px; background: #0e0a1c; border: 1.5px solid #c084fc; border-radius: 50%; width: 22px; height: 22px; font-size: 11px; font-weight: bold; color: #c084fc; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
            .stats-col { display: flex; flex-direction: column; gap: 5px; width: 130px; }
            .player-name { font-weight: 700; font-size: 15px; color: #e2e8f0; text-shadow: 0 2px 4px rgba(100,60,200,0.5); margin-bottom: 2px;}
            .bar-bg { width: 100%; height: 6px; background: rgba(6,6,12,0.75); border-radius: 4px; overflow: hidden; border: 1px solid rgba(120,90,255,0.2); }
            .bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
            .bar-hp { background: linear-gradient(90deg, #b91c1c, #ef4444); }
            .bar-mp { background: linear-gradient(90deg, #4338ca, #818cf8); }
            
            .currency-panel { display: flex; gap: 10px; pointer-events: auto; }
            .currency-item { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; color: #fbbf24; }
            .currency-item.gems { color: #69c0ff; }
            
            .sidebar { position: absolute; right: 20px; top: 80px; display: flex; flex-direction: column; gap: 16px; pointer-events: auto; }
            .sidebar-btn { width: 44px; height: 44px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 20px; position: relative; border-radius: 22px; font-family: 'Segoe UI Emoji', sans-serif;}
            .sidebar-badge { position: absolute; top: -2px; right: -2px; background: #ef4444; color: white; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; font-weight: bold; display: flex; justify-content: center; align-items: center; border: 2px solid #000; }
            
            .bottom-right { position: absolute; right: 20px; bottom: 30px; pointer-events: auto; width: 220px; height: 220px; }
            .auto-btn { position: absolute; top: 0; right: 0; padding: 6px 18px; border-radius: 20px; font-size: 12px; font-weight: bold; color: rgba(192,132,252,0.8); display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
            .auto-btn.active { background: rgba(168,85,247,0.7); color: #e2e8f0; border-color: transparent;}
            
            .skill-btn { position: absolute; border-radius: 50%; display: flex; justify-content: center; align-items: center; overflow: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.6); border: 2px solid rgba(120,90,255,0.3); font-family: 'Segoe UI Emoji', sans-serif;}
            .skill-atk { width: 80px; height: 80px; bottom: 0; right: 0; font-size: 36px; background: rgba(15,10,30,0.7); }
            .skill-dodge { width: 52px; height: 52px; bottom: 8px; right: 94px; font-size: 22px; background: rgba(15,10,30,0.65); }
            .skill-s1 { width: 56px; height: 56px; bottom: 62px; right: 84px; font-size: 24px; background: rgba(15,10,30,0.65); }
            .skill-s2 { width: 56px; height: 56px; bottom: 102px; right: 38px; font-size: 24px; background: rgba(15,10,30,0.65); }
            .skill-ult { width: 66px; height: 66px; bottom: 106px; left: -10px; font-size: 28px; background: rgba(168,85,247,0.45); border-color: rgba(192,132,252,0.7); }
            
            .cd-overlay { position: absolute; bottom: 0; left: 0; right: 0; height: 0%; background: rgba(6,4,14,0.75); display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.2rem; color: #fff; text-shadow: 0 2px 4px #000; pointer-events: none; overflow: hidden; transition: height 0.1s linear;}
            
            .exp-bar-container { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(6,4,14,0.7); pointer-events: none; }
            .exp-bar-fill { height: 100%; width: 0%; background: #c084fc; box-shadow: 0 0 10px #c084fc; transition: width 0.3s ease-out; }
            
            .location-title { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); text-align: center; pointer-events: none; }
            .loc-main { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; color: #e2e8f0; text-shadow: 0 0 12px rgba(120,60,255,0.6); }
            .loc-sub { font-size: 11px; color: rgba(148,163,184,0.8); letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; font-weight: 600; }
        `;
        document.head.appendChild(style);
    }

    private buildDOM() {
        this.rootDiv.innerHTML = `
            <div class="location-title">
                <div class="loc-main">Ashen Wasteland</div>
                <div class="loc-sub">EXPLORATION REGION</div>
            </div>
            
            <div class="top-bar">
                <div class="glass-panel avatar-panel action-btn" id="hud-avatar-btn">
                    <div class="avatar-img">👤<div class="level-badge" id="hud-lvl">1</div></div>
                    <div class="stats-col">
                        <div class="player-name">Wanderer</div>
                        <div class="bar-bg"><div class="bar-fill bar-hp" id="hud-hp"></div></div>
                        <div class="bar-bg"><div class="bar-fill bar-mp" id="hud-mp"></div></div>
                    </div>
                </div>
                
                <div class="currency-panel">
                    <div class="glass-panel currency-item" id="hud-gold">🪙 0</div>
                    <div class="glass-panel currency-item gems" id="hud-gems">💠 0</div>
                </div>
            </div>

            <div class="sidebar">
                <div class="glass-panel sidebar-btn action-btn" id="hud-btn-char">✦</div>
                <div class="glass-panel sidebar-btn action-btn" id="hud-btn-inv">🎒<div class="sidebar-badge">!</div></div>
                <div class="glass-panel sidebar-btn action-btn">📜</div>
                <div class="glass-panel sidebar-btn action-btn" id="hud-btn-shop">🌟<div class="sidebar-badge">1</div></div>
            </div>

            <div class="bottom-right">
                <div class="glass-panel auto-btn action-btn" id="hud-btn-auto">⚙ AUTO</div>
                
                <div class="skill-btn skill-ult action-btn" id="hud-btn-ult">💥<div class="cd-overlay" id="cd-ult"></div></div>
                <div class="skill-btn skill-s2 action-btn" id="hud-btn-s2">❄️<div class="cd-overlay" id="cd-skill2"></div></div>
                <div class="skill-btn skill-s1 action-btn" id="hud-btn-s1">⚡<div class="cd-overlay" id="cd-skill1"></div></div>
                <div class="skill-btn skill-dodge action-btn" id="hud-btn-dodge">💨<div class="cd-overlay" id="cd-dodge"></div></div>
                <div class="skill-btn skill-atk action-btn" id="hud-btn-atk">⚔️<div class="cd-overlay" id="cd-atk"></div></div>
            </div>
            
            <div class="exp-bar-container"><div class="exp-bar-fill" id="hud-exp"></div></div>
        `;

        // Cache elements
        this.hpFill = document.getElementById("hud-hp")!;
        this.mpFill = document.getElementById("hud-mp")!;
        this.expFill = document.getElementById("hud-exp")!;
        this.levelText = document.getElementById("hud-lvl")!;
        this.goldText = document.getElementById("hud-gold")!;
        this.gemsText = document.getElementById("hud-gems")!;
        this.autoBtn = document.getElementById("hud-btn-auto")!;

        // Event Listeners
        document.getElementById("hud-avatar-btn")!.addEventListener("pointerdown", () => {
            if (this.onCharacterButton) this.onCharacterButton();
        });
        document.getElementById("hud-btn-char")!.addEventListener("pointerdown", () => {
            if (this.onCharacterButton) this.onCharacterButton();
        });
        document.getElementById("hud-btn-inv")!.addEventListener("pointerdown", () => {
            if (this.onInventoryButton) this.onInventoryButton();
        });
        document.getElementById("hud-btn-shop")!.addEventListener("pointerdown", () => {
            if (this.onShopButton) this.onShopButton();
        });

        this.autoBtn.addEventListener("pointerdown", () => {
            this.autoActive = !this.autoActive;
            if (this.autoActive) {
                this.autoBtn.classList.add("active");
            } else {
                this.autoBtn.classList.remove("active");
            }
            this.onAutoBattleToggle.notifyObservers(this.autoActive);
        });

        // Skills bindings
        const bindSkill = (domId: string, skillId: string) => {
            const btn = document.getElementById(domId);
            if (!btn) return;
            btn.addEventListener("pointerdown", (e) => {
                e.preventDefault(); // Stop zoom
                this.onSkillUse.notifyObservers(skillId);
            });
            const cd = document.getElementById(`cd-${skillId}`);
            if (cd) this.skillCDOverlays.set(skillId, cd);
        };
        bindSkill("hud-btn-atk", "atk");
        bindSkill("hud-btn-dodge", "dodge");
        bindSkill("hud-btn-s1", "skill1");
        bindSkill("hud-btn-s2", "skill2");
        bindSkill("hud-btn-ult", "ult");
    }

    public updateSkillCooldown(skillId: string, remaining: number, total: number): void {
        const overlay = this.skillCDOverlays.get(skillId);
        if (!overlay) return;

        if (remaining <= 0) {
            overlay.style.height = "0%";
            overlay.innerHTML = "";
        } else {
            const pct = Math.min(100, (remaining / total) * 100);
            overlay.style.height = `${pct}%`;
            overlay.innerHTML = remaining >= 1 ? Math.ceil(remaining).toString() : "";
        }
    }

    public updateFromStats(s: PlayerStats): void {
        const hpPct = Math.max(0, Math.min(100, Math.round((s.hp / s.maxHp) * 100)));
        const mpPct = Math.max(0, Math.min(100, Math.round((s.mp / s.maxMp) * 100)));
        const expPct = Math.max(0, Math.min(100, Math.round((s.exp / s.maxExp) * 100)));

        if (this.hpFill) this.hpFill.style.width = `${hpPct}%`;
        if (this.mpFill) this.mpFill.style.width = `${mpPct}%`;
        if (this.expFill) this.expFill.style.width = `${expPct}%`;

        if (this.levelText) this.levelText.innerText = `${s.level}`;
        if (this.goldText) this.goldText.innerText = `🪙 ${(s.gold / 1000).toFixed(1)}K`;
        if (this.gemsText) this.gemsText.innerText = `💠 ${s.gems}`;
    }
}
