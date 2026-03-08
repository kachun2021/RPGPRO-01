export interface PlayerIdentitySnapshot {
      playerName: string;
      heroType: number;
      heroName: string;
      roleLabel: string;
      starterPetNames: string[];
      growthGoal: string;
      starterFusionGoal: string | null;
}

export function formatStarterPetSummary(names: string[], maxCount = 3): string {
      const clean = names
            .map((name) => String(name ?? '').trim())
            .filter(Boolean);
      if (clean.length <= 0) return '尚未配置主寵';
      if (clean.length <= maxCount) return clean.join(' / ');
      return `${clean.slice(0, maxCount).join(' / ')} +${clean.length - maxCount}`;
}
