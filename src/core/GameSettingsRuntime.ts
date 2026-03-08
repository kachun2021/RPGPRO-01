import type { SystemSettings } from '../ui/SystemPanel';

type RuntimeSettingSlice = Pick<SystemSettings, 'joystickSensitivity' | 'cameraSensitivity' | 'invertCameraY' | 'autoLockTarget'>;

interface GameSettingsRuntimeAdapters {
      joystick: {
            setSensitivity(value: number): void;
      };
      camera: {
            setTouchSettings(settings: { sensitivity: number; invertY: boolean }): void;
      };
      combat: {
            setAutoLockEnabled(enabled: boolean): void;
      };
}

const DEFAULT_APPLIED_SETTINGS: RuntimeSettingSlice = {
      joystickSensitivity: 1,
      cameraSensitivity: 1,
      invertCameraY: false,
      autoLockTarget: true,
};

export class GameSettingsRuntime {
      private _applied: RuntimeSettingSlice = { ...DEFAULT_APPLIED_SETTINGS };
      private readonly _adapters: GameSettingsRuntimeAdapters;

      constructor(adapters: GameSettingsRuntimeAdapters) {
            this._adapters = adapters;
      }

      apply(settings: SystemSettings): void {
            const next: RuntimeSettingSlice = {
                  joystickSensitivity: Number.isFinite(settings.joystickSensitivity) ? settings.joystickSensitivity : 1,
                  cameraSensitivity: Number.isFinite(settings.cameraSensitivity) ? settings.cameraSensitivity : 1,
                  invertCameraY: settings.invertCameraY === true,
                  autoLockTarget: settings.autoLockTarget !== false,
            };

            this._adapters.joystick.setSensitivity(next.joystickSensitivity);
            this._adapters.camera.setTouchSettings({
                  sensitivity: next.cameraSensitivity,
                  invertY: next.invertCameraY,
            });
            this._adapters.combat.setAutoLockEnabled(next.autoLockTarget);
            this._applied = next;
      }

      get snapshot(): RuntimeSettingSlice {
            return { ...this._applied };
      }
}
