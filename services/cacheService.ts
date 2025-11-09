interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

// Bump this version to invalidate previously cached entries and avoid restoring stale UI
const APP_VERSION = '1.0.1'; // Update this when making breaking changes
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour default

export const cacheService = {
  set: <T>(key: string, data: T, duration: number = CACHE_DURATION): void => {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      version: APP_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const cached: CacheItem<T> = JSON.parse(item);
      
      // Version check
      if (cached.version !== APP_VERSION) {
        localStorage.removeItem(key);
        return null;
      }

      // Expiry check
      if (Date.now() - cached.timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }

      return cached.data;
    } catch {
      return null;
    }
  },

  clear: (key?: string): void => {
    if (key) {
      localStorage.removeItem(key);
    } else {
      localStorage.clear();
    }
  }
};