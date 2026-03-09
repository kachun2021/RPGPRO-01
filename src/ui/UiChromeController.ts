export type UiChromeState = 'explore' | 'combat' | 'panel_focus' | 'dialogue_focus' | 'death';
export type UiChromeGroup = 'identity' | 'guidance' | 'combat' | 'navigation' | 'utility';
export type PrimaryNavMode = 'primary' | 'suppressed';

export interface UiChromeSnapshot {
      state: UiChromeState;
      groups: Record<UiChromeGroup, boolean>;
      primaryNavMode: PrimaryNavMode;
}

const VISIBILITY_BY_STATE: Record<UiChromeState, Record<UiChromeGroup, boolean>> = {
      explore: {
            identity: true,
            guidance: true,
            combat: true,
            navigation: true,
            utility: true,
      },
      combat: {
            identity: true,
            guidance: false,
            combat: true,
            navigation: true,
            utility: false,
      },
      panel_focus: {
            identity: false,
            guidance: false,
            combat: false,
            navigation: false,
            utility: false,
      },
      dialogue_focus: {
            identity: false,
            guidance: false,
            combat: false,
            navigation: false,
            utility: false,
      },
      death: {
            identity: false,
            guidance: false,
            combat: false,
            navigation: false,
            utility: false,
      },
};

export class UiChromeController {
      private _state: UiChromeState = 'explore';

      constructor(private readonly _root: HTMLElement = document.body) {
            this._apply();
      }

      get state(): UiChromeState {
            return this._state;
      }

      get snapshot(): UiChromeSnapshot {
            return {
                  state: this._state,
                  groups: { ...VISIBILITY_BY_STATE[this._state] },
                  primaryNavMode: VISIBILITY_BY_STATE[this._state].navigation ? 'primary' : 'suppressed',
            };
      }

      setState(nextState: UiChromeState): void {
            if (this._state === nextState) return;
            this._state = nextState;
            this._apply();
      }

      private _apply(): void {
            const snapshot = this.snapshot;
            this._root.dataset.uiChromeState = snapshot.state;
            this._root.dataset.primaryNavMode = snapshot.primaryNavMode;
            for (const [group, isVisible] of Object.entries(snapshot.groups) as Array<[UiChromeGroup, boolean]>) {
                  this._root.dataset[`chrome${group.charAt(0).toUpperCase()}${group.slice(1)}`] = isVisible ? 'visible' : 'hidden';
            }
            this._root.classList.toggle('ui-panel-focus', snapshot.state === 'panel_focus' || snapshot.state === 'dialogue_focus');
      }
}
