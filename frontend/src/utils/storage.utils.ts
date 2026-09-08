/**
 * Resilient Session & Local Storage utility for operational draft persistence across browser refreshes
 */
export const StorageService = {
  get: <T>(key: string, fallback: T, storageType: 'session' | 'local' = 'session'): T => {
    try {
      const storage = typeof window !== 'undefined' && storageType === 'local' ? window.localStorage : window.sessionStorage;
      const val = storage.getItem(key);
      if (!val) return fallback;
      return JSON.parse(val) as T;
    } catch (e) {
      return fallback;
    }
  },

  set: (key: string, value: any, storageType: 'session' | 'local' = 'session'): void => {
    try {
      const storage = typeof window !== 'undefined' && storageType === 'local' ? window.localStorage : window.sessionStorage;
      storage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`StorageService.set notice for key ${key}:`, e);
    }
  },

  remove: (key: string, storageType: 'session' | 'local' = 'session'): void => {
    try {
      const storage = typeof window !== 'undefined' && storageType === 'local' ? window.localStorage : window.sessionStorage;
      storage.removeItem(key);
    } catch (e) {
      /* ignore */
    }
  },
};

export default StorageService;
