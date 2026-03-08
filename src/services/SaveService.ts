export interface SaveOperationResult {
      ok: boolean;
      message: string;
      savedAt?: string;
      version?: number;
}

export interface SaveService<TContext> {
      save(ctx: TContext): SaveOperationResult;
      load(ctx: TContext): Promise<SaveOperationResult> | SaveOperationResult;
      clear(): void;
}
