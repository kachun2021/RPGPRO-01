/**
 * QuestManager — Main story 25 chapters, side quests, daily quests, pet exchange.
 * Progress persisted to localStorage.
 */

export type QuestType = 'main' | 'side' | 'daily';
export type QuestStatus = 'locked' | 'available' | 'active' | 'complete';
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
      prereqId?: string;   // Must complete this quest first
      npcId?: string;      // NPC that gives this quest
}

// 25 Main Story Chapters (every 5 unlocks a new zone)
const MAIN_QUESTS: QuestDef[] = [];
for (let i = 1; i <= 25; i++) {
      const unlockZones: Record<number, string> = {
            5: 'misty_forest', 10: 'crystal_cave', 15: 'desert_ruins',
            20: 'frozen_peak', 25: 'dark_abyss',
      };
      MAIN_QUESTS.push({
            id: `main_${i}`, chapter: i, type: 'main',
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
            id: 'side_herb', type: 'side', name: '草藥採集', description: '收集 10 株草藥',
            objectives: [{ type: 'collect', target: 'herb', required: 10, current: 0, label: '草藥 0/10' }],
            rewards: { exp: 200, gold: 100 }
      },
      {
            id: 'side_iron', type: 'side', name: '礦石收集', description: '收集 8 塊鐵礦',
            objectives: [{ type: 'collect', target: 'iron_ore', required: 8, current: 0, label: '鐵礦 0/8' }],
            rewards: { exp: 250, gold: 120 }
      },
      {
            id: 'side_crystal', type: 'side', name: '水晶獵人', description: '收集 3 顆魔力水晶',
            objectives: [{ type: 'collect', target: 'crystal', required: 3, current: 0, label: '水晶 0/3' }],
            rewards: { exp: 500, gold: 300 }
      },
      {
            id: 'side_slayer', type: 'side', name: '怪物獵人', description: '擊殺 30 隻怪物',
            objectives: [{ type: 'kill', target: 'any', required: 30, current: 0, label: '擊殺 0/30' }],
            rewards: { exp: 400, gold: 200 }
      },
];

// Daily Quests (3 per day)
const DAILY_TEMPLATES: QuestDef[] = [
      {
            id: 'daily_kill', type: 'daily', name: '每日討伐', description: '擊殺 15 隻怪物',
            objectives: [{ type: 'kill', target: 'any', required: 15, current: 0, label: '擊殺 0/15' }],
            rewards: { exp: 300, gold: 150 }
      },
      {
            id: 'daily_collect', type: 'daily', name: '每日採集', description: '收集 5 個材料',
            objectives: [{ type: 'collect', target: 'any_material', required: 5, current: 0, label: '材料 0/5' }],
            rewards: { exp: 250, gold: 100 }
      },
      {
            id: 'daily_boss', type: 'daily', name: '每日Boss', description: '擊殺 1 隻Boss',
            objectives: [{ type: 'kill', target: 'boss', required: 1, current: 0, label: 'Boss 0/1' }],
            rewards: { exp: 500, gold: 300 }
      },
];

// Pet Exchange Quests
const PET_EXCHANGE_QUESTS: QuestDef[] = [
      {
            id: 'exchange_dragon', type: 'side', name: '龍之交換', description: '用 Draco 交換稀有 龍王',
            npcId: 'npc_pet_trader',
            objectives: [{ type: 'exchange_pet', target: 'draco', required: 1, current: 0, label: '交出 Draco' }],
            rewards: { petId: 'dragon_king' }
      },
      {
            id: 'exchange_phoenix', type: 'side', name: '鳳凰交換', description: '用 Birdco 交換稀有 火鳳凰',
            npcId: 'npc_pet_trader',
            objectives: [{ type: 'exchange_pet', target: 'birdco', required: 1, current: 0, label: '交出 Birdco' }],
            rewards: { petId: 'phoenix' }
      },
];

const SAVE_KEY = 'fpo_quests_v1';

export class QuestManager {
      private _quests: Map<string, QuestDef> = new Map();
      private _onChange: (() => void) | null = null;

      set onChange(cb: (() => void) | null) { this._onChange = cb; }

      constructor() {
            // Register all quests
            for (const q of [...MAIN_QUESTS, ...SIDE_QUESTS, ...DAILY_TEMPLATES, ...PET_EXCHANGE_QUESTS]) {
                  this._quests.set(q.id, { ...q });
            }
            this._loadProgress();
            // Make first main quest available
            this._updateAvailability();
      }

      get allQuests(): QuestDef[] { return Array.from(this._quests.values()); }

      getByType(type: QuestType): QuestDef[] {
            return this.allQuests.filter(q => q.type === type);
      }

      getStatus(quest: QuestDef): QuestStatus {
            const allDone = quest.objectives.every(o => o.current >= o.required);
            if (allDone) return 'complete';
            if (quest.objectives.some(o => o.current > 0)) return 'active';
            if (quest.prereqId) {
                  const prereq = this._quests.get(quest.prereqId);
                  if (prereq && !prereq.objectives.every(o => o.current >= o.required)) return 'locked';
            }
            return 'available';
      }

      /** Track a kill event */
      trackKill(monsterName: string, isBoss: boolean): void {
            let changed = false;
            for (const q of this._quests.values()) {
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

      /** Track item collection */
      trackCollect(itemId: string): void {
            let changed = false;
            for (const q of this._quests.values()) {
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

      /** Complete a quest and claim rewards */
      claimReward(questId: string): QuestReward | null {
            const quest = this._quests.get(questId);
            if (!quest) return null;
            if (!quest.objectives.every(o => o.current >= o.required)) return null;
            this._updateAvailability();
            this._saveProgress();
            this._onChange?.();
            return quest.rewards;
      }

      /** Reset daily quests (call at midnight) */
      resetDailies(): void {
            for (const q of this._quests.values()) {
                  if (q.type === 'daily') {
                        for (const obj of q.objectives) obj.current = 0;
                  }
            }
            this._saveProgress();
            this._onChange?.();
      }

      get mainProgress(): { current: number; total: number } {
            const main = this.getByType('main');
            const done = main.filter(q => q.objectives.every(o => o.current >= o.required)).length;
            return { current: done, total: main.length };
      }

      private _updateAvailability(): void {
            // Unlock next main quest if prereq complete
            for (const q of this._quests.values()) {
                  if (q.type === 'main' && q.prereqId) {
                        const prereq = this._quests.get(q.prereqId);
                        if (prereq && prereq.objectives.every(o => o.current >= o.required)) {
                              // prereq done — this quest is now available
                        }
                  }
            }
      }

      private _saveProgress(): void {
            const data: Record<string, number[]> = {};
            for (const [id, q] of this._quests) {
                  data[id] = q.objectives.map(o => o.current);
            }
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
      }

      private _loadProgress(): void {
            try {
                  const raw = localStorage.getItem(SAVE_KEY);
                  if (!raw) return;
                  const data: Record<string, number[]> = JSON.parse(raw);
                  for (const [id, progress] of Object.entries(data)) {
                        const q = this._quests.get(id);
                        if (!q) continue;
                        for (let i = 0; i < q.objectives.length && i < progress.length; i++) {
                              q.objectives[i].current = progress[i];
                        }
                  }
            } catch { /* ignore */ }
      }
}
