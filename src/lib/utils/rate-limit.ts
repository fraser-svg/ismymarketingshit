/**
 * In-memory rate limiter with TTL-based expiry.
 *
 * Limits:
 *   - 1 analysis per email per 7 days
 *   - 1 analysis per domain per 24 hours
 *   - 5 submissions per IP per hour
 *
 * Uses a simple Map for local development. For production with multiple
 * instances, swap the store implementation for Redis (the interface is the
 * same: set a key with a TTL, read it back).
 */

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds
}

interface RateLimitEntry {
  count: number;
  expiresAt: number; // epoch ms
}

const store = new Map<string, RateLimitEntry>();

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Purge expired entries periodically so the Map doesn't grow unbounded. */
let lastPurge = Date.now();
const PURGE_INTERVAL_MS = 60_000; // 1 minute

function purgeExpired(): void {
  const now = Date.now();
  if (now - lastPurge < PURGE_INTERVAL_MS) return;
  lastPurge = now;

  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Increment a rate-limit bucket. Returns the current count after increment.
 * If the key doesn't exist or has expired, it starts fresh with count=1.
 */
function increment(key: string, windowSeconds: number): { count: number; retryAfter: number } {
  purgeExpired();

  const now = Date.now();
  const existing = store.get(key);

  if (existing && existing.expiresAt > now) {
    existing.count += 1;
    const retryAfter = Math.ceil((existing.expiresAt - now) / 1000);
    return { count: existing.count, retryAfter };
  }

  // New window
  store.set(key, {
    count: 1,
    expiresAt: now + windowSeconds * 1000,
  });

  return { count: 1, retryAfter: windowSeconds };
}

export async function checkRateLimit(params: {
  email: string;
  domain: string;
  ip: string;
}): Promise<RateLimitResult> {
  const { email, domain, ip } = params;

  // 1. Email: 1 per 7 days
  const emailKey = `rl:email:${email.toLowerCase()}`;
  const emailResult = increment(emailKey, WEEK);
  if (emailResult.count > 1) {
    return {
      allowed: false,
      reason: "You've already requested an analysis this week. Please try again later.",
      retryAfter: emailResult.retryAfter,
    };
  }

  // 2. Domain: 1 per 24 hours
  const domainKey = `rl:domain:${domain.toLowerCase()}`;
  const domainResult = increment(domainKey, DAY);
  if (domainResult.count > 1) {
    return {
      allowed: false,
      reason: "This domain was already analysed in the last 24 hours. Please try again later.",
      retryAfter: domainResult.retryAfter,
    };
  }

  // 3. IP: 5 per hour
  const ipKey = `rl:ip:${ip}`;
  const ipResult = increment(ipKey, HOUR);
  if (ipResult.count > 5) {
    return {
      allowed: false,
      reason: "Too many requests. Please try again later.",
      retryAfter: ipResult.retryAfter,
    };
  }

  return { allowed: true };
}

/** Exported for testing: reset the in-memory store. */
export function _resetStore(): void {
  store.clear();
}
