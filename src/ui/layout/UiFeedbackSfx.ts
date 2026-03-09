export function initUiFeedbackSfx(): void {
      let audioCtx: AudioContext | null = null;
      let lastPlayed = 0;

      const resolveContext = (): AudioContext | null => {
            if (audioCtx) return audioCtx;
            const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as (new () => AudioContext) | undefined;
            if (!Ctor) return null;
            audioCtx = new Ctor();
            return audioCtx;
      };

      const playClick = (): void => {
            const ctx = resolveContext();
            if (!ctx) return;
            const now = performance.now();
            if (now - lastPlayed < 40) return;
            lastPlayed = now;

            if (ctx.state === 'suspended') {
                  void ctx.resume();
            }

            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(820, t);
            osc.frequency.exponentialRampToValueAtTime(560, t + 0.04);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.018, t + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.065);
      };

      document.addEventListener('pointerdown', (evt) => {
            const target = evt.target as HTMLElement | null;
            if (!target) return;
            if (!target.closest('.game-btn, .skill-tab-btn, .afk-menu-btn, .panel-close, .sa-nav-btn')) return;
            try {
                  playClick();
            } catch {
                  // Ignore audio failures to keep UI responsive.
            }
      }, true);
}
