import type { SocialAvailability, SocialService } from '../../SocialService';

const LOCAL_ONLY_REASON = '社交與聊天仍為本機展示模式，尚未接入雲端服務。';

export class LocalSocialService implements SocialService {
      getAvailability(): SocialAvailability {
            return {
                  mode: 'local_only',
                  enabled: false,
                  reason: LOCAL_ONLY_REASON,
            };
      }
}
