/**
 * Best-effort per-IP rate limit for movie search. In-memory only: each serverless instance
 * tracks separately; use Redis/Upstash for a global limit in production if needed.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export function checkMovieSearchRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.windowStart >= WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (b.count >= MAX_REQUESTS_PER_WINDOW) {
    const waitMs = WINDOW_MS - (now - b.windowStart);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(waitMs / 1000)) };
  }
  b.count += 1;
  return { ok: true };
}
