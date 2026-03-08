export interface SocialAvailability {
      mode: 'local_only';
      enabled: false;
      reason: string;
}

export interface SocialService {
      getAvailability(): SocialAvailability;
}
