type CacheEntry = { value: any; expiresAt: number };

const CACHE: Record<string, CacheEntry> = {};

export const setCache = (key: string, value: any, ttlSeconds: number = 60) => {
  try {
    CACHE[key] = { value, expiresAt: Date.now() + ttlSeconds * 1000 };
  } catch (e) {
    // noop
  }
};

export const getCache = (key: string) => {
  const e = CACHE[key];
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    delete CACHE[key];
    return null;
  }
  return e.value;
};

export const clearCache = (key?: string) => {
  if (key) delete CACHE[key];
  else {
    for (const k of Object.keys(CACHE)) delete CACHE[k];
  }
};
