// src/lib/queryCache.js
// Simple query cache using localStorage

export function setQueryCache(key, data, ttlMinutes = 30) {
  const expires = Date.now() + ttlMinutes * 60 * 1000;
  const value = { data, expires };
  localStorage.setItem(key, JSON.stringify(value));
}

export function getQueryCache(key) {
  const value = localStorage.getItem(key);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed.expires && parsed.expires > Date.now()) {
      return parsed.data;
    } else {
      localStorage.removeItem(key);
      return null;
    }
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function clearQueryCache(key) {
  localStorage.removeItem(key);
}
