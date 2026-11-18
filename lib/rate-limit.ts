import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = "public-search" | "admin-login";
const policies: Record<Bucket, { limit: number; window: `${number} ${"s" | "m" | "h"}` }> = {
  "public-search": { limit: 12, window: "1 m" },
  "admin-login": { limit: 5, window: "15 m" }
};

let redis: Redis | null = null;
const limiters = new Map<Bucket, Ratelimit>();

function getLimiter(bucket: Bucket) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  redis ??= new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  let limiter = limiters.get(bucket);
  if (!limiter) {
    const policy = policies[bucket];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
      prefix: `suhsug:${bucket}`,
      analytics: true
    });
    limiters.set(bucket, limiter);
  }
  return limiter;
}

export async function checkRateLimit(bucket: Bucket, identity: string) {
  const limiter = getLimiter(bucket);
  if (!limiter) {
    if (process.env.NODE_ENV === "production") return { success: false, remaining: 0, reset: Date.now() + 60_000, configured: false };
    return { success: true, remaining: Number.MAX_SAFE_INTEGER, reset: 0, configured: true };
  }
  const result = await limiter.limit(identity);
  return { ...result, configured: true };
}

export function requestIdentity(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers.get("x-real-ip") || forwarded || "unknown";
}
