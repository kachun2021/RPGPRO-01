import { Registry } from './Registry';

export class OrientationManager {
      private _mediaQuery: MediaQueryList;

      constructor() {
            this._mediaQuery = window.matchMedia('(orientation: portrait)');
            this._handleChange = this._handleChange.bind(this);
      }

      init(): void {
            // Set initial orientation
            this._handleChange(this._mediaQuery);

            // Listen for changes
            this._mediaQuery.addEventListener('change', this._handleChange);

            // Also listen to resize as backup
            window.addEventListener('resize', () => {
                  const isPortrait = window.innerHeight > window.innerWidth;
                  const newOrientation = isPortrait ? 'portrait' : 'landscape';
                  if (newOrientation !== Registry.orientation) {
                        Registry.setOrientation(newOrientation);
                        this._applyMode(newOrientation);
                  }
            });
      }

      private _handleChange(e: MediaQueryList | MediaQueryListEvent): void {
            const isPortrait = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
            const orientation = isPortrait ? 'portrait' : 'landscape';
            Registry.setOrientation(orientation);
            this._applyMode(orientation);
      }

      private _applyMode(mode: 'landscape' | 'portrait'): void {
            document.body.setAttribute('data-orientation', mode);
            console.log(`[OrientationManager] Mode: ${mode}`);

            if (mode === 'portrait') {
                  // AFK mode: disable combat controls, show stats only
                  document.body.classList.add('afk-mode');
                  document.body.classList.remove('full-mode');
            } else {
                  document.body.classList.add('full-mode');
                  document.body.classList.remove('afk-mode');
            }
      }

      dispose(): void {
            this._mediaQuery.removeEventListener('change', this._handleChange);
      }
}
