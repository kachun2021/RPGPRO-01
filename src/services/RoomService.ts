export interface RoomAvailability {
      mode: 'local_only';
      enabled: false;
      reason: string;
}

export interface RoomService {
      getAvailability(): RoomAvailability;
}
