/**
 * Rate limiter with Redis backend (production) and in-memory fallback (dev).
 *
 * Limits:
 *   - 1 analysis per email per 7 days
 *   - 1 analysis per domain per 24 hours
 *   - 5 submissions per IP per hour
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL is set.
 * Falls back to in-memory Map for local development.
 */

import { redis } from "@/lib/services/redis";

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds
}

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

// ---------------------------------------------------------------------------
// In-memory fallback (development only)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  expiresAt: number; // epoch ms
}

const memoryStore = new Map<string, RateLimitEntry>();
let lastPurge = Date.now();
const PURGE_INTERVAL_MS = 60_000;

function purgeExpired(): void {
  const now = Date.now();
  if (now - lastPurge < PURGE_INTERVAL_MS) return;
  lastPurge = now;
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(key);
  }
}

function memoryIncrement(key: string, windowSeconds: number): { count: number; retryAfter: number } {
  purgeExpired();
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (existing && existing.expiresAt > now) {
    existing.count += 1;
    return { count: existing.count, retryAfter: Math.ceil((existing.expiresAt - now) / 1000) };
  }

  memoryStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
  return { count: 1, retryAfter: windowSeconds };
}

// ---------------------------------------------------------------------------
// Redis backend (production)
// ---------------------------------------------------------------------------

const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

async function redisIncrement(key: string, windowSeconds: number): Promise<{ count: number; retryAfter: number }> {
  // INCR returns the new value. If key is new, it returns 1.
  const count = await redis.incr(key);

  if (count === 1) {
    // First request in this window — set the expiry
    await redis.expire(key, windowSeconds);
  }

  // Get TTL for retry-after header
  const ttl = await redis.ttl(key);
  return { count, retryAfter: ttl > 0 ? ttl : windowSeconds };
}

async function increment(key: string, windowSeconds: number): Promise<{ count: number; retryAfter: number }> {
  if (useRedis) {
    try {
      return await redisIncrement(key, windowSeconds);
    } catch (err) {
      console.warn(`[rate-limit] Redis error, falling back to memory: ${err instanceof Error ? err.message : String(err)}`);
      return memoryIncrement(key, windowSeconds);
    }
  }
  return memoryIncrement(key, windowSeconds);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function checkRateLimit(params: {
  email?: string;
  domain: string;
  ip: string;
}): Promise<RateLimitResult> {
  const { email, domain, ip } = params;

  // 1. Email: 1 per 7 days (skipped when email not provided)
  if (email) {
    const emailKey = `rl:email:${email.toLowerCase()}`;
    const emailResult = await increment(emailKey, WEEK);
    if (emailResult.count > 1) {
      return {
        allowed: false,
        reason: "You've already requested an analysis this week. Please try again later.",
        retryAfter: emailResult.retryAfter,
      };
    }
  }

  // 2. Domain dedup is handled in the submit route via the domain→jobId
  //    Redis key, so we no longer rate-limit by domain here.

  // 3. IP: 5 per hour
  const ipKey = `rl:ip:${ip}`;
  const ipResult = await increment(ipKey, HOUR);
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
  memoryStore.clear();
}
