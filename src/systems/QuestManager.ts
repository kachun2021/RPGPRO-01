/**
 * QuestManager — Main story 25 chapters, side quests, daily quests, pet exchange.
 * Progress persisted to localStorage.
 * 
 * Fixed logic:
 * - `claimed` flag prevents double-claiming
 * - `getStatus` checks claimed + locked properly
 * - `trackKill/trackCollect` only updates available/active quests (not locked/claimed)
 * - Daily auto-reset based on last reset date
 */

export type QuestType = 'main' | 'side' | 'daily';
export type QuestStatus = 'locked' | 'available' | 'active' | 'complete' | 'claimed';
export type QuestObjectiveType = 'kill' | 'collect' | 'talk' | 'exchange_pet';

export interface QuestObjective {
      type: QuestObjectiveType;
      target: string;
      required: number;
      current: number;
      label: string;
}

export interface QuestReward {
      exp?: number;
      gold?: number;
      itemId?: string;
      petId?: string;
      unlockZone?: string;
}

export interface QuestDef {
      id: string;
      chapter?: number;
      type: QuestType;
      name: string;
      description: string;
      objectives: QuestObjective[];
      rewards: QuestReward;
      prereqId?: string;
      npcId?: string;
      claimed: boolean;       // Prevents double-claiming
}

// 25 Main Story Chapters (every 5 unlocks a new zone)
const MAIN_QUESTS: QuestDef[] = [];
for (let i = 1; i <= 25; i++) {
      const unlockZones: Record<number, string> = {
            5: 'misty_forest',
            10: 'crystal_caves',
            15: 'ancient_ruins',
            20: 'frost_peaks',
            25: 'dark_hollow',
      };
      MAIN_QUESTS.push({
            id: `main_${i}`, chapter: i, type: 'main', claimed: false,
            name: `第 ${i} 章`,
            description: `主線任務第 ${i} 章 — ${i <= 5 ? '新手冒險' : i <= 10 ? '深入迷霧' : i <= 15 ? '沙漠探索' : i <= 20 ? '冰峰挑戰' : '最終決戰'}`,
            objectives: [
                  { type: 'kill', target: 'any', required: 5 + i * 2, current: 0, label: `擊殺 ${5 + i * 2} 隻怪物` },
            ],
            rewards: {
                  exp: 100 * i, gold: 50 * i,
                  ...(unlockZones[i] ? { unlockZone: unlockZones[i] } : {}),
            },
            prereqId: i > 1 ? `main_${i - 1}` : undefined,
      });
}

// Side Quests
const SIDE_QUESTS: QuestDef[] = [
      {
            id: 'side_herb', type: 'side', name: '草藥採集', description: '收集 10 株草藥', claimed: false,
            objectives: [{ type: 'collect', target: 'herb', required: 10, current: 0, label: '草藥 0/10' }],
            rewards: { exp: 200, gold: 100 }
      },
      {
            id: 'side_iron', type: 'side', name: '礦石收集', description: '收集 8 塊鐵礦', claimed: false,
            objectives: [{ type: 'collect', target: 'iron_ore', required: 8, current: 0, label: '鐵礦 0/8' }],
            rewards: { exp: 250, gold: 120 }
      },
      {
            id: 'side_crystal', type: 'side', name: '水晶獵人', description: '收集 3 顆魔力水晶', claimed: false,
            objectives: [{ type: 'collect', target: 'crystal', required: 3, current: 0, label: '水晶 0/3' }],
            rewards: { exp: 500, gold: 300 }
      },
      {
            id: 'side_slayer', type: 'side', name: '怪物獵人', description: '擊殺 30 隻怪物', claimed: false,
            objectives: [{ type: 'kill', target: 'any', required: 30, current: 0, label: '擊殺 0/30' }],
            rewards: { exp: 400, gold: 200 }
      },
];

// Daily Quests
const DAILY_TEMPLATES: QuestDef[] = [
      {
            id: 'daily_kill', type: 'daily', name: '每日討伐', description: '擊殺 15 隻怪物', claimed: false,
            objectives: [{ type: 'kill', target: 'any', required: 15, current: 0, label: '擊殺 0/15' }],
            rewards: { exp: 300, gold: 150 }
      },
      {
            id: 'daily_collect', type: 'daily', name: '每日採集', description: '收集 5 個材料', claimed: false,
            objectives: [{ type: 'collect', target: 'any_material', required: 5, current: 0, label: '材料 0/5' }],
            rewards: { exp: 250, gold: 100 }
      },
      {
            id: 'daily_boss', type: 'daily', name: '每日Boss', description: '擊殺 1 隻Boss', claimed: false,
            objectives: [{ type: 'kill', target: 'boss', required: 1, current: 0, label: 'Boss 0/1' }],
            rewards: { exp: 500, gold: 300 }
      },
];

// Pet Exchange Quests
const PET_EXCHANGE_QUESTS: QuestDef[] = [
      {
            id: 'exchange_dragon', type: 'side', name: '龍之交換', description: '用 Draco 交換稀有 龍王', claimed: false,
            npcId: 'npc_pet_trader',
            objectives: [{ type: 'exchange_pet', target: 'draco', required: 1, current: 0, label: '交出 Draco' }],
            rewards: { petId: 'dragon_king' }
      },
      {
            id: 'exchange_phoenix', type: 'side', name: '鳳凰交換', description: '用 Birdco 交換稀有 火鳳凰', claimed: false,
            npcId: 'npc_pet_trader',
            objectives: [{ type: 'exchange_pet', target: 'birdco', required: 1, current: 0, label: '交出 Birdco' }],
            rewards: { petId: 'phoenix' }
      },
];

const SAVE_KEY = 'fpo_quests_v2';
const DAILY_RESET_KEY = 'fpo_daily_reset';

export class QuestManager {
      private _quests: Map<string, QuestDef> = new Map();
      private _onChange: (() => void) | null = null;

      set onChange(cb: (() => void) | null) { this._onChange = cb; }

      constructor() {
            for (const q of [...MAIN_QUESTS, ...SIDE_QUESTS, ...DAILY_TEMPLATES, ...PET_EXCHANGE_QUESTS]) {
                  this._quests.set(q.id, { ...q, objectives: q.objectives.map(o => ({ ...o })) });
            }
            this._loadProgress();
            this._checkDailyReset();
      }

      get allQuests(): QuestDef[] { return Array.from(this._quests.values()); }

      getByType(type: QuestType): QuestDef[] {
            return this.allQuests.filter(q => q.type === type);
      }

      /** Determine quest status with proper locking and claim checks */
      getStatus(quest: QuestDef): QuestStatus {
            // Already claimed → done
            if (quest.claimed) return 'claimed';

            // Check prereq lock (main story chain)
            if (quest.prereqId) {
                  const prereq = this._quests.get(quest.prereqId);
                  if (prereq && !prereq.claimed) return 'locked';
            }

            // All objectives met → ready to claim
            const allDone = quest.objectives.every(o => o.current >= o.required);
            if (allDone) return 'complete';

            // Some progress → active
            if (quest.objectives.some(o => o.current > 0)) return 'active';

            return 'available';
      }

      /** Track a kill — only on non-locked, non-claimed quests */
      trackKill(monsterName: string, isBoss: boolean): void {
            let changed = false;
            for (const q of this._quests.values()) {
                  const status = this.getStatus(q);
                  if (status === 'locked' || status === 'claimed') continue;
                  for (const obj of q.objectives) {
                        if (obj.type !== 'kill' || obj.current >= obj.required) continue;
                        if (obj.target === 'any' || obj.target === monsterName || (obj.target === 'boss' && isBoss)) {
                              obj.current++;
                              changed = true;
                        }
                  }
            }
            if (changed) { this._saveProgress(); this._onChange?.(); }
      }

      /** Track item collection — only on non-locked, non-claimed quests */
      trackCollect(itemId: string): void {
            let changed = false;
            for (const q of this._quests.values()) {
                  const status = this.getStatus(q);
                  if (status === 'locked' || status === 'claimed') continue;
                  for (const obj of q.objectives) {
                        if (obj.type !== 'collect' || obj.current >= obj.required) continue;
                        if (obj.target === itemId || obj.target === 'any_material') {
                              obj.current++;
                              changed = true;
                        }
                  }
            }
            if (changed) { this._saveProgress(); this._onChange?.(); }
      }

      /** Claim reward — marks quest as claimed, prevents re-claiming */
      claimReward(questId: string): QuestReward | null {
            const quest = this._quests.get(questId);
            if (!quest || quest.claimed) return null;
            if (!quest.objectives.every(o => o.current >= o.required)) return null;

            quest.claimed = true;
            this._saveProgress();
            this._onChange?.();
            console.log(`[Quest] Claimed: ${quest.name}`);
            return quest.rewards;
      }

      /** Auto-check and reset daily quests if date changed */
      private _checkDailyReset(): void {
            const today = new Date().toDateString();
            try {
                  const lastReset = localStorage.getItem(DAILY_RESET_KEY);
                  if (lastReset !== today) {
                        // Reset all daily quests
                        for (const q of this._quests.values()) {
                              if (q.type === 'daily') {
                                    q.claimed = false;
                                    for (const obj of q.objectives) obj.current = 0;
                              }
                        }
                        localStorage.setItem(DAILY_RESET_KEY, today);
                        this._saveProgress();
                        console.log('[Quest] Daily quests reset for', today);
                  }
            } catch { /* ignore */ }
      }

      get mainProgress(): { current: number; total: number } {
            const main = this.getByType('main');
            const done = main.filter(q => q.claimed).length;
            return { current: done, total: main.length };
      }

      private _saveProgress(): void {
            const data: Record<string, { progress: number[]; claimed: boolean }> = {};
            for (const [id, q] of this._quests) {
                  data[id] = { progress: q.objectives.map(o => o.current), claimed: q.claimed };
            }
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
      }

      private _loadProgress(): void {
            try {
                  const raw = localStorage.getItem(SAVE_KEY);
                  if (!raw) return;
                  const data: Record<string, { progress: number[]; claimed: boolean }> = JSON.parse(raw);
                  for (const [id, saved] of Object.entries(data)) {
                        const q = this._quests.get(id);
                        if (!q) continue;
                        q.claimed = saved.claimed ?? false;
                        for (let i = 0; i < q.objectives.length && i < saved.progress.length; i++) {
                              q.objectives[i].current = saved.progress[i];
                        }
                  }
            } catch { /* ignore */ }
      }
}
