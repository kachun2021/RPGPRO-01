import type { AuthAccountSummary, AuthService, HeroProfileRecord } from '../../AuthService';
import { localKeyValueStore } from './LocalStorageKV';

const UID_STORAGE_KEY = 'fpo.player.uid';
const HERO_TYPE_STORAGE_KEY = 'fpo.hero.type.v1';
const HERO_PROFILE_STORAGE_KEY = 'fpo.hero.profile.v1';
const HERO_PROFILE_VERSION = 1;

export class LocalAuthService implements AuthService {
      getAccountSummary(): AuthAccountSummary {
            return {
                  uid: this.getOrCreateUid(),
                  provider: 'local',
                  storageLabel: '本機單機資料',
                  isCloudBacked: false,
            };
      }

      getOrCreateUid(): string {
            const existing = localKeyValueStore.getString(UID_STORAGE_KEY);
            if (existing) return existing;

            const created = `FPO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
            localKeyValueStore.setString(UID_STORAGE_KEY, created);
            return created;
      }

      loadHeroProfile(): HeroProfileRecord | null {
            const stored = localKeyValueStore.getJson<Partial<HeroProfileRecord>>(HERO_PROFILE_STORAGE_KEY);
            if (!stored) return null;

            const heroType = Number(stored.heroType ?? NaN);
            if (!Number.isFinite(heroType)) return null;

            return {
                  version: HERO_PROFILE_VERSION,
                  heroType: Math.floor(heroType),
                  playerName: String(stored.playerName ?? '').trim(),
                  createdAt: String(stored.createdAt ?? ''),
            };
      }

      saveHeroProfile(profile: HeroProfileRecord): HeroProfileRecord {
            const payload: HeroProfileRecord = {
                  version: HERO_PROFILE_VERSION,
                  heroType: Math.floor(profile.heroType),
                  playerName: String(profile.playerName ?? '').trim(),
                  createdAt: String(profile.createdAt ?? ''),
            };
            localKeyValueStore.setJson(HERO_PROFILE_STORAGE_KEY, payload);
            localKeyValueStore.setString(HERO_TYPE_STORAGE_KEY, String(payload.heroType));
            return payload;
      }

      loadPreferredHeroType(): number | null {
            const raw = localKeyValueStore.getString(HERO_TYPE_STORAGE_KEY);
            const parsed = Number(raw ?? NaN);
            return Number.isFinite(parsed) ? Math.floor(parsed) : null;
      }

      savePreferredHeroType(heroType: number): void {
            localKeyValueStore.setString(HERO_TYPE_STORAGE_KEY, String(Math.floor(heroType)));
      }
}
