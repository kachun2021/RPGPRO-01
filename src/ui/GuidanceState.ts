import type { PlayerIdentitySnapshot } from '../core/PlayerIdentity';
import type { OnboardingManager, OnboardingStepId } from '../systems/OnboardingManager';
import type { QuestDef, QuestManager, QuestStatus } from '../systems/QuestManager';

export type GuidanceSource = 'onboarding' | 'main_quest' | 'growth' | 'none';
export type GuidanceAction = 'quest' | 'shop' | 'pet' | 'fusion' | 'character' | 'none';

export interface GuidanceState {
      source: GuidanceSource;
      title: string;
      text: string;
      progressLabel: string | null;
      action: GuidanceAction;
      actionLabel: string | null;
      relatedQuestId: string | null;
}

interface GuidanceResolverInput {
      onboarding: OnboardingManager;
      questManager: QuestManager;
      identity: PlayerIdentitySnapshot;
}

function describeQuestObjective(quest: QuestDef): string {
      const objective = quest.objectives[0];
      if (!objective) return '查看任務詳情以確認下一步。';
      return `${objective.label}: ${objective.current}/${objective.required}`;
}

function resolveOnboardingAction(stepId: OnboardingStepId): { action: GuidanceAction; label: string } {
      switch (stepId) {
            case 'visit_shop':
                  return { action: 'shop', label: '去商店' };
            case 'open_pet_panel':
                  return { action: 'pet', label: '打開寵物' };
            case 'view_fusion_goal':
                  return { action: 'fusion', label: '查看融合' };
            default:
                  return { action: 'quest', label: '看任務' };
      }
}

function buildMainQuestGuidance(questManager: QuestManager): GuidanceState | null {
      const mainQuests = questManager.getByType('main');
      const reportable = mainQuests.find((quest) => questManager.getStatus(quest) === 'turn_in');
      const active = mainQuests.find((quest) => questManager.getStatus(quest) === 'active');
      const complete = mainQuests.find((quest) => questManager.getStatus(quest) === 'complete');
      const quest = reportable ?? active ?? complete ?? null;
      if (!quest) return null;

      const status = questManager.getStatus(quest);
      const guidanceText = status === 'turn_in'
            ? `${quest.name} 已可回報，先回對應 NPC。`
            : status === 'complete'
                  ? `${quest.name} 已達成，現在回報領獎。`
                  : describeQuestObjective(quest);

      return {
            source: 'main_quest',
            title: quest.name,
            text: guidanceText,
            progressLabel: `${questManager.mainProgress.current}/${questManager.mainProgress.total}`,
            action: 'quest',
            actionLabel: status === 'turn_in' || status === 'complete' ? '回報主線' : '查看主線',
            relatedQuestId: quest.id,
      };
}

export function resolveGuidanceState(input: GuidanceResolverInput): GuidanceState {
      const onboardingStep = input.onboarding.currentStep;
      if (onboardingStep && !input.onboarding.isComplete) {
            const action = resolveOnboardingAction(onboardingStep.id);
            return {
                  source: 'onboarding',
                  title: onboardingStep.title,
                  text: onboardingStep.description,
                  progressLabel: `${input.onboarding.progress.completed}/${input.onboarding.progress.total}`,
                  action: action.action,
                  actionLabel: action.label,
                  relatedQuestId: onboardingStep.id === 'meet_elder' ? 'main_1' : null,
            };
      }

      const questGuidance = buildMainQuestGuidance(input.questManager);
      if (questGuidance) return questGuidance;

      const fusionGoal = input.identity.starterFusionGoal ? `推薦融合：${input.identity.starterFusionGoal}` : null;
      return {
            source: input.identity.growthGoal ? 'growth' : 'none',
            title: input.identity.growthGoal ? '角色成長' : '暫無目標',
            text: fusionGoal ?? input.identity.growthGoal ?? '目前沒有明確引導，先查看角色成長與融合線。',
            progressLabel: null,
            action: input.identity.growthGoal ? 'character' : 'none',
            actionLabel: input.identity.growthGoal ? '角色成長' : null,
            relatedQuestId: null,
      };
}
