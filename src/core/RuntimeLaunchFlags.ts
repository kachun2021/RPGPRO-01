function getSearchParams(): URLSearchParams | null {
      if (typeof window === 'undefined') return null;
      return new URLSearchParams(window.location.search);
}

export function isAutomatedRuntime(): boolean {
      const search = getSearchParams();
      if (search?.get('manualtest') === '1') return false;
      if (search?.get('autotest') === '1') return true;
      if (search?.get('autotestLite') === '1') return true;
      return typeof navigator !== 'undefined' && navigator.webdriver === true;
}

export function shouldForceHeroCreationFromQuery(): boolean {
      return getSearchParams()?.get('heroCreate') === '1';
}

export function shouldUseReducedRenderQuality(): boolean {
      const search = getSearchParams();
      if (search?.get('renderMode') === 'full') return false;
      if (search?.get('autotestLite') === '1') return true;
      if (search?.get('lowfx') === '1') return true;
      return false;
}

export function getSmokeProfileFromQuery(): string | null {
      return getSearchParams()?.get('smokeProfile') ?? null;
}
