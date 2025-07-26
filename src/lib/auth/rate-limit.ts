import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import type { RedisRateLimiter } from '@/lib/redis';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime?: number;
}

// Redis-based rate limiter instances
const rateLimiters = new Map<string, RedisRateLimiter>();

async function getRateLimiter(config: RateLimitConfig): Promise<RedisRateLimiter> {
  const key = `${config.maxRequests}-${config.windowMs}`;
  if (!rateLimiters.has(key)) {
    // Only create Redis rate limiter when actually needed
    const { RedisRateLimiter } = await import('@/lib/redis');
    rateLimiters.set(key, new RedisRateLimiter(config.windowMs, config.maxRequests));
  }
  const limiter = rateLimiters.get(key);
  if (limiter == null) {
    throw new Error(`Rate limiter not found for key: ${key}`);
  }
  return limiter;
}

export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<RateLimitResult> => {
    const limiter = await getRateLimiter(config);
    const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown';
    const userAgent = req.headers.get('user-agent') ?? 'unknown';

    // Create a more specific key that includes path and user agent hash
    const userAgentHash = Buffer.from(userAgent).toString('base64').slice(0, 8);
    const key = `${ip}:${req.nextUrl.pathname}:${userAgentHash}`;

    try {
      const result = await limiter.checkLimit(key);

      log.debug('Rate limit check', {
        key: `${ip}:${req.nextUrl.pathname}`,
        allowed: result.allowed,
        count: result.count,
        max: config.maxRequests,
      });

      return {
        success: result.allowed,
        remaining: Math.max(0, config.maxRequests - result.count),
        resetTime: result.resetTime,
      };
    } catch (error) {
      log.error('Rate limit error', {
        key: `${ip}:${req.nextUrl.pathname}`,
        error: (error as Error).message,
      });

      // Allow on Redis error to prevent blocking users
      return {
        success: true,
        remaining: config.maxRequests - 1,
      };
    }
  };
}

// Pre-configured rate limiters
export const authRateLimit = rateLimit({
  maxRequests: 5, // 5 attempts per window
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export const registerRateLimit = rateLimit({
  maxRequests: 3, // 3 registration attempts per window
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const apiRateLimit = rateLimit({
  maxRequests: 100, // 100 requests per window
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export const uploadRateLimit = rateLimit({
  maxRequests: 10, // 10 uploads per window
  windowMs: 60 * 1000, // 1 minute
});

// Helper to create rate limit response
export function createRateLimitResponse(
  remaining: number,
  resetTime?: number,
  retryAfterSeconds?: number,
): NextResponse {
  const defaultRetryAfter = 900; // 15 minutes
  const retryAfter = retryAfterSeconds ?? defaultRetryAfter;

  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': remaining.toString(),
    'Retry-After': retryAfter.toString(),
  };

  if (resetTime != null && resetTime > 0) {
    headers['X-RateLimit-Reset'] = Math.ceil(resetTime / 1000).toString();
  }

  return NextResponse.json(
    {
      error: 'Too many requests',
      retryAfter: `${Math.ceil(retryAfter / 60)} minutes`,
      resetTime: resetTime != null && resetTime > 0 ? new Date(resetTime).toISOString() : undefined,
    },
    {
      status: 429,
      headers,
    },
  );
}

// Middleware helper for applying rate limits
export async function applyRateLimit(
  req: NextRequest,
  limiter: (req: NextRequest) => Promise<RateLimitResult>,
): Promise<NextResponse | null> {
  const result = await limiter(req);

  if (!result.success) {
    const retryAfterSeconds =
      result.resetTime != null && result.resetTime > 0
        ? Math.ceil((result.resetTime - Date.now()) / 1000)
        : 900;

    return createRateLimitResponse(result.remaining, result.resetTime, retryAfterSeconds);
  }

  return null; // No rate limit exceeded
}
