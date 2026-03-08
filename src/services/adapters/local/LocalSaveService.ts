import type { SaveOperationResult, SaveService } from '../../SaveService';
import {
      clearRuntimeSave,
      loadRuntimeGame,
      saveRuntimeGame,
      type RuntimeSaveContext,
} from '../../../systems/RuntimeSaveManager';

export class LocalSaveService implements SaveService<RuntimeSaveContext> {
      save(ctx: RuntimeSaveContext): SaveOperationResult {
            return saveRuntimeGame(ctx);
      }

      async load(ctx: RuntimeSaveContext): Promise<SaveOperationResult> {
            return loadRuntimeGame(ctx);
      }

      clear(): void {
            clearRuntimeSave();
      }
}
