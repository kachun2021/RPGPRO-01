export interface HeroProfileRecord {
      version: number;
      heroType: number;
      playerName: string;
      createdAt: string;
}

export interface AuthAccountSummary {
      uid: string;
      provider: 'local';
      storageLabel: string;
      isCloudBacked: boolean;
}

export interface AuthService {
      getAccountSummary(): AuthAccountSummary;
      getOrCreateUid(): string;
      loadHeroProfile(): HeroProfileRecord | null;
      saveHeroProfile(profile: HeroProfileRecord): HeroProfileRecord;
      loadPreferredHeroType(): number | null;
      savePreferredHeroType(heroType: number): void;
}
