// src/lib/queryCache.js
// Simple query cache using localStorage

export function setQueryCache(key, data, ttlMinutes = 30) {

  // Remove any cache keys that are substrings of the new key (except the new key itself)
  for (let i = 0; i < localStorage.length; i++) {
    const existingKey = localStorage.key(i);
    if (
      existingKey !== key &&
      existingKey &&
      key.startsWith(existingKey)
    ) {
      localStorage.removeItem(existingKey);
      i--; // Adjust index after removal
    }
  }

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

// Purge expired cache and manage size (run this periodically or on app load)
export function purgeQueryCache({ maxBytes = 5 * 1024 * 1024 } = {}) {
  // Remove expired entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const value = localStorage.getItem(key);
      if (!value) continue;
      const parsed = JSON.parse(value);
      if (parsed.expires <= Date.now()) {
        localStorage.removeItem(key);
        i--; // Adjust index after removal
      }
    } catch {
      localStorage.removeItem(key);
      i--;
    }
  }

  // Check total size
  let totalBytes = 0;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    totalBytes += value ? value.length : 0;
    keys.push(key);
  }

  // If over limit, purge product_ keys first
  if (totalBytes > maxBytes) {
    for (const key of keys) {
      if (key.startsWith('product_')) {
        localStorage.removeItem(key);
        totalBytes -= localStorage.getItem(key)?.length || 0;
        if (totalBytes <= maxBytes) break;
      }
    }
  }
}