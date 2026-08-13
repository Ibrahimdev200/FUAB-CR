interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, RateLimitTracker>();

/**
 * Basic in-memory IP rate limiter helper
 * @param ip Client IP address
 * @param limit Max allowed requests within window
 * @param windowMs Time window in milliseconds (default: 60,000ms = 1 minute)
 */
export function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): { isLimited: boolean; remaining: number } {
  const now = Date.now();
  const tracker = ipMap.get(ip);

  if (!tracker || tracker.resetAt <= now) {
    ipMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { isLimited: false, remaining: limit - 1 };
  }

  if (tracker.count >= limit) {
    return { isLimited: true, remaining: 0 };
  }

  tracker.count += 1;
  return { isLimited: false, remaining: limit - tracker.count };
}
