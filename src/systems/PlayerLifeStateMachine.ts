import type { Player } from '../entities/Player';

export type PlayerLifeState = 'alive' | 'down' | 'revive_pending' | 'revived';
export type PlayerReviveMode = 'field' | 'town';

export interface PlayerLifeStateContext {
      state: PlayerLifeState;
      previousState: PlayerLifeState;
      sourceName: string | null;
      remainingInvulnerabilitySec: number;
      reviveMode: PlayerReviveMode | null;
}

export interface PlayerReviveResult {
      hpRatio?: number;
      mpRatio?: number;
      invulnerabilitySec?: number;
      sourceName?: string | null;
}

export class PlayerLifeStateMachine {
      private _player: Player;
      private _state: PlayerLifeState = 'alive';
      private _sourceName: string | null = null;
      private _remainingInvulnerabilitySec = 0;
      private _reviveMode: PlayerReviveMode | null = null;
      private _listeners: Array<(ctx: PlayerLifeStateContext) => void> = [];

      constructor(player: Player) {
            this._player = player;
            this.syncFromStats();
      }

      get state(): PlayerLifeState {
            return this._state;
      }

      get sourceName(): string | null {
            return this._sourceName;
      }

      get remainingInvulnerabilitySec(): number {
            return this._remainingInvulnerabilitySec;
      }

      get reviveMode(): PlayerReviveMode | null {
            return this._reviveMode;
      }

      get isDeadLike(): boolean {
            return this._state === 'down' || this._state === 'revive_pending';
      }

      get canTakeDamage(): boolean {
            return this._state === 'alive';
      }

      onStateChange(listener: (ctx: PlayerLifeStateContext) => void): () => void {
            this._listeners.push(listener);
            return () => {
                  const idx = this._listeners.indexOf(listener);
                  if (idx >= 0) this._listeners.splice(idx, 1);
            };
      }

      applyDamage(amount: number, sourceName: string): number {
            if (!this.canTakeDamage) return 0;

            const actualDamage = Math.max(0, Math.round(amount));
            if (actualDamage <= 0) return 0;

            this._player.stats.hp = Math.max(0, this._player.stats.hp - actualDamage);
            this._sourceName = sourceName;

            if (this._player.stats.hp <= 0) {
                  this._setState('down');
            }

            return actualDamage;
      }

      queueRevive(mode: PlayerReviveMode): boolean {
            if (this._state !== 'down') return false;
            this._reviveMode = mode;
            this._setState('revive_pending');
            return true;
      }

      completeRevive(result: PlayerReviveResult = {}): void {
            const hpRatio = Math.max(0.2, Math.min(1, result.hpRatio ?? 0.6));
            const mpRatio = Math.max(0.1, Math.min(1, result.mpRatio ?? 0.4));
            const invulnerabilitySec = Math.max(0, result.invulnerabilitySec ?? 6);

            this._player.stats.hp = Math.max(1, Math.round(this._player.stats.maxHp * hpRatio));
            this._player.stats.mp = Math.max(0, Math.round(this._player.stats.maxMp * mpRatio));
            this._sourceName = result.sourceName ?? this._sourceName;
            this._remainingInvulnerabilitySec = invulnerabilitySec;
            this._setState(invulnerabilitySec > 0 ? 'revived' : 'alive');
      }

      cancelPendingRevive(): void {
            if (this._state !== 'revive_pending') return;
            this._reviveMode = null;
            this._setState('down');
      }

      syncFromStats(): void {
            if (this._player.stats.hp <= 0) {
                  this._player.stats.hp = 0;
                  this._remainingInvulnerabilitySec = 0;
                  this._setState('down');
                  return;
            }
            this._remainingInvulnerabilitySec = 0;
            this._reviveMode = null;
            this._setState('alive');
      }

      update(dt: number): void {
            if (this._state !== 'revived') return;
            this._remainingInvulnerabilitySec = Math.max(0, this._remainingInvulnerabilitySec - dt);
            if (this._remainingInvulnerabilitySec <= 0) {
                  this._remainingInvulnerabilitySec = 0;
                  this._reviveMode = null;
                  this._setState('alive');
            }
      }

      private _setState(next: PlayerLifeState): void {
            if (this._state === next) return;
            const previousState = this._state;
            this._state = next;
            if (next === 'alive') {
                  this._sourceName = null;
                  this._reviveMode = null;
            }
            if (next === 'down') {
                  this._remainingInvulnerabilitySec = 0;
                  this._reviveMode = null;
            }
            const ctx: PlayerLifeStateContext = {
                  state: this._state,
                  previousState,
                  sourceName: this._sourceName,
                  remainingInvulnerabilitySec: this._remainingInvulnerabilitySec,
                  reviveMode: this._reviveMode,
            };
            for (const listener of this._listeners) listener(ctx);
      }
}
