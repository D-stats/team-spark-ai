import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

export type RateLimitOptions = {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of requests per interval
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export function rateLimit(options: RateLimitOptions): {
  check: (request: NextRequest, limit: number) => RateLimitResult;
} {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (request: NextRequest, limit: number): RateLimitResult => {
      const identifier = getIdentifier(request);
      const now = Date.now();
      const windowStart = now - options.interval;

      const requestTimestamps = tokenCache.get(identifier) || [];
      const requestsInWindow = requestTimestamps.filter((timestamp) => timestamp > windowStart);

      if (requestsInWindow.length >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: windowStart + options.interval,
        };
      }

      requestsInWindow.push(now);
      tokenCache.set(identifier, requestsInWindow);

      return {
        success: true,
        limit,
        remaining: limit - requestsInWindow.length,
        reset: windowStart + options.interval,
      };
    },
  };
}

function getIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    forwarded !== null && forwarded !== '' ? (forwarded.split(',')[0] ?? 'unknown') : 'unknown';
  return ip;
}

// Pre-configured rate limiters for different use cases
export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 30,
});

export const authRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 5,
});

export const uploadRateLimit = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 10,
});
