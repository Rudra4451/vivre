import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export type RateLimitType = "completion" | "purchase" | "cron";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

let redisInstance: Redis | null = null;
const limiters: {
  completion?: Ratelimit;
  purchase?: Ratelimit;
  cron?: Ratelimit;
} = {};

/**
 * In-memory fallback sliding window store for testing or local development
 * when Upstash Redis credentials are not configured.
 */
interface LocalRecord {
  count: number;
  resetAt: number;
}
const localFallbackStore = new Map<string, LocalRecord>();

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    redisInstance = new Redis({ url, token });
    return redisInstance;
  } catch (err) {
    console.warn("[RateLimit] Failed to initialize Upstash Redis client:", err);
    return null;
  }
}

function getRatelimit(type: RateLimitType): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  if (limiters[type]) {
    return limiters[type]!;
  }

  switch (type) {
    case "completion":
      limiters.completion = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        prefix: "vivre:rl:completion",
        analytics: false,
      });
      return limiters.completion;
    case "purchase":
      limiters.purchase = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "vivre:rl:purchase",
        analytics: false,
      });
      return limiters.purchase;
    case "cron":
      limiters.cron = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "vivre:rl:cron",
        analytics: false,
      });
      return limiters.cron;
  }
}

function localFallbackLimit(
  key: string,
  maxRequests: number,
  intervalMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const record = localFallbackStore.get(key);

  if (!record || now > record.resetAt) {
    const newRecord = { count: 1, resetAt: now + intervalMs };
    localFallbackStore.set(key, newRecord);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: newRecord.resetAt,
    };
  }

  if (record.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - record.count,
    reset: record.resetAt,
  };
}

/**
 * Distributed rate limiter for serverless environments using Upstash Redis.
 *
 * Resilience policy:
 * - Fails open gracefully for transient infrastructure/network errors during gameplay
 *   to avoid making the application unusable.
 * - Fails closed strictly when the rate limit threshold is exceeded.
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = "completion"
): Promise<RateLimitResult> {
  const limiter = getRatelimit(type);
  const maxRequests = type === "completion" ? 20 : 10;

  if (!limiter) {
    // If Upstash is not configured, fall back to local store (e.g. dev/test)
    return localFallbackLimit(`${type}:${identifier}`, maxRequests, 60_000);
  }

  try {
    const res = await limiter.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  } catch (error) {
    // Transient infrastructure failure handling
    console.error(`[RateLimit] Transient failure for ${type}:${identifier}:`, error);

    // Fail open for gameplay paths so transient network/Redis errors do not crash gameplay
    return {
      success: true,
      limit: maxRequests,
      remaining: 1,
      reset: Date.now() + 60_000,
    };
  }
}

/**
 * Reset local fallback limiter (primarily for unit/concurrency tests)
 */
export function resetLocalFallbackStore(): void {
  localFallbackStore.clear();
}
