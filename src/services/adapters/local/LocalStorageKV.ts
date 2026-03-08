export interface KeyValueStore {
      getString(key: string): string | null;
      setString(key: string, value: string): void;
      remove(key: string): void;
      keys(): string[];
      getJson<T>(key: string): T | null;
      setJson(key: string, value: unknown): void;
}

class BrowserLocalStorageKV implements KeyValueStore {
      getString(key: string): string | null {
            if (typeof window === 'undefined') return null;
            try {
                  return window.localStorage.getItem(key);
            } catch {
                  return null;
            }
      }

      setString(key: string, value: string): void {
            if (typeof window === 'undefined') return;
            try {
                  window.localStorage.setItem(key, value);
            } catch {
                  // Ignore quota/security failures in local-first mode.
            }
      }

      remove(key: string): void {
            if (typeof window === 'undefined') return;
            try {
                  window.localStorage.removeItem(key);
            } catch {
                  // Ignore storage failures.
            }
      }

      keys(): string[] {
            if (typeof window === 'undefined') return [];
            try {
                  const list: string[] = [];
                  for (let i = 0; i < window.localStorage.length; i += 1) {
                        const key = window.localStorage.key(i);
                        if (key) list.push(key);
                  }
                  return list;
            } catch {
                  return [];
            }
      }

      getJson<T>(key: string): T | null {
            const raw = this.getString(key);
            if (!raw) return null;
            try {
                  return JSON.parse(raw) as T;
            } catch {
                  return null;
            }
      }

      setJson(key: string, value: unknown): void {
            this.setString(key, JSON.stringify(value));
      }
}

export const localKeyValueStore: KeyValueStore = new BrowserLocalStorageKV();
