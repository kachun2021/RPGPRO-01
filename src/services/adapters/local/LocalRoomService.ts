import type { RoomAvailability, RoomService } from '../../RoomService';

const LOCAL_ONLY_REASON = '多人房間仍未上線，目前只有單機場景。';

export class LocalRoomService implements RoomService {
      getAvailability(): RoomAvailability {
            return {
                  mode: 'local_only',
                  enabled: false,
                  reason: LOCAL_ONLY_REASON,
            };
      }
}
