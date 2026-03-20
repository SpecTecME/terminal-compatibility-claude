import { base44 } from '@/api/base44Client';

let cache = null;
let inflight = null;

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Get current user with in-memory caching and single-flight behavior.
 * @param {Object} options
 * @param {boolean} options.forceRefresh - Bypass cache and force a fresh fetch
 * @returns {Promise<User>}
 */
export async function getCurrentUserCached({ forceRefresh = false } = {}) {
  const now = Date.now();

  // Check cache validity
  if (!forceRefresh && cache && (now - cache.ts) < CACHE_TTL) {
    console.log("me cache hit", now);
    return cache.user;
  }

  // Single-flight: if already fetching, return the same promise
  if (inflight) {
    console.log("me request already in flight, waiting", now);
    return inflight;
  }

  // Cache miss - make the network call
  console.log("me cache miss, calling base44.auth.me", now);
  
  inflight = base44.auth.me()
    .then(user => {
      cache = { user, ts: Date.now() };
      inflight = null;
      return user;
    })
    .catch(error => {
      inflight = null;
      throw error;
    });

  return inflight;
}

/**
 * Clear the cache (useful for logout or forced refresh scenarios)
 */
export function clearCurrentUserCache() {
  cache = null;
  inflight = null;
  console.log("User cache cleared", Date.now());
}