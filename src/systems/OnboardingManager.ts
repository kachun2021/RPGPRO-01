import type { PlayerIdentitySnapshot } from '../core/PlayerIdentity';
import { localKeyValueStore } from '../services/adapters/local/LocalStorageKV';

export type OnboardingStepId =
      | 'meet_elder'
      | 'win_first_battle'
      | 'pickup_first_drop'
      | 'visit_shop'
      | 'open_pet_panel'
      | 'view_fusion_goal';

export interface OnboardingStepState {
      id: OnboardingStepId;
      title: string;
      description: string;
      done: boolean;
      active: boolean;
      locked: boolean;
}

export interface OnboardingSaveState {
      version: number;
      completed: OnboardingStepId[];
      introSeen: boolean;
      collapsed: boolean;
}

const STORAGE_KEY = 'fpo.onboarding.v2';
const STORAGE_VERSION = 2;

export class OnboardingManager {
      private _identity: PlayerIdentitySnapshot;
      private _completed = new Set<OnboardingStepId>();
      private _introSeen = false;
      private _collapsed = false;
      private readonly _listeners = new Set<() => void>();

      constructor(identity: PlayerIdentitySnapshot) {
            this._identity = identity;
            this._load();
      }

      subscribe(cb: () => void): () => void {
            this._listeners.add(cb);
            return () => {
                  this._listeners.delete(cb);
            };
      }

      setIdentity(identity: PlayerIdentitySnapshot): void {
            this._identity = identity;
            this._emitChange(false);
      }

      mark(stepId: OnboardingStepId): void {
            if (this._completed.has(stepId)) return;
            this._completed.add(stepId);
            this._introSeen = true;
            this._save();
            this._emitChange(false);
      }

      setCollapsed(collapsed: boolean): void {
            if (this._collapsed === collapsed) return;
            this._collapsed = collapsed;
            this._save();
            this._emitChange(false);
      }

      acknowledgeIntro(): void {
            if (this._introSeen) return;
            this._introSeen = true;
            this._save();
            this._emitChange(false);
      }

      get identity(): PlayerIdentitySnapshot {
            return this._identity;
      }

      get introSeen(): boolean {
            return this._introSeen;
      }

      get collapsed(): boolean {
            return this._collapsed;
      }

      get progress(): { completed: number; total: number } {
            const total = this._blueprints.length;
            return {
                  completed: this._completed.size,
                  total,
            };
      }

      get currentStep(): OnboardingStepState | null {
            return this.steps.find((step) => !step.done) ?? null;
      }

      get isComplete(): boolean {
            return this._completed.size >= this._blueprints.length;
      }

      get shouldRenderWidget(): boolean {
            return !this.isComplete || !this._introSeen;
      }

      get steps(): OnboardingStepState[] {
            let activeUnlocked = true;
            return this._blueprints.map((blueprint) => {
                  const done = this._completed.has(blueprint.id);
                  const active = !done && activeUnlocked;
                  const locked = !done && !activeUnlocked;
                  if (!done && activeUnlocked) activeUnlocked = false;
                  return {
                        ...blueprint,
                        done,
                        active,
                        locked,
                  };
            });
      }

      exportState(): OnboardingSaveState {
            return {
                  version: STORAGE_VERSION,
                  completed: Array.from(this._completed),
                  introSeen: this._introSeen,
                  collapsed: this._collapsed,
            };
      }

      importState(state: Partial<OnboardingSaveState> | null): void {
            this._completed.clear();
            this._introSeen = false;
            this._collapsed = false;

            if (state && Number(state.version ?? 0) === STORAGE_VERSION) {
                  const completed = Array.isArray(state.completed) ? state.completed : [];
                  for (const stepId of completed) {
                        if (this._blueprints.some((step) => step.id === stepId)) {
                              this._completed.add(stepId);
                        }
                  }
                  this._introSeen = state.introSeen === true;
                  this._collapsed = state.collapsed === true;
            }

            this._save();
            this._emitChange(false);
      }

      private get _blueprints(): Array<Pick<OnboardingStepState, 'id' | 'title' | 'description'>> {
            const fusionGoal = this._identity.starterFusionGoal
                  ? `先看推薦線：${this._identity.starterFusionGoal}`
                  : '先看推薦公式與缺料導引。';

            return [
                  {
                        id: 'meet_elder',
                        title: '先找村長接主線',
                        description: '在新手村和村長對話，拿到第一章委託，避免一開局就迷路。',
                  },
                  {
                        id: 'win_first_battle',
                        title: '打掉第一批草原怪',
                        description: '離開安全區後先打一場，確認你會移動、鎖敵與放技能。',
                  },
                  {
                        id: 'pickup_first_drop',
                        title: '撿第一個掉落或金幣',
                        description: '靠近戰利品完成拾取，確認你知道戰鬥收益會進背包。',
                  },
                  {
                        id: 'visit_shop',
                        title: '去商店補給藥水',
                        description: '先熟悉藥水與基礎補給位置，之後推圖不會卡在續戰資源。',
                  },
                  {
                        id: 'open_pet_panel',
                        title: '打開寵物面板',
                        description: `檢查你的主寵編隊：${this._identity.starterPetNames.slice(0, 3).join(' / ') || '尚未配置'}`,
                  },
                  {
                        id: 'view_fusion_goal',
                        title: '查看第一個融合目標',
                        description: fusionGoal,
                  },
            ];
      }

      private _load(): void {
            const parsed = localKeyValueStore.getJson<Partial<OnboardingSaveState>>(STORAGE_KEY);
            if (!parsed || Number(parsed.version ?? 0) !== STORAGE_VERSION) return;

            const completed = Array.isArray(parsed.completed) ? parsed.completed : [];
            for (const stepId of completed) {
                  if (this._blueprints.some((step) => step.id === stepId)) {
                        this._completed.add(stepId);
                  }
            }
            this._introSeen = parsed.introSeen === true;
            this._collapsed = parsed.collapsed === true;
      }

      private _save(): void {
            localKeyValueStore.setJson(STORAGE_KEY, this.exportState());
      }

      private _emitChange(persist = true): void {
            if (persist) this._save();
            for (const listener of this._listeners) {
                  listener();
            }
      }
}
