import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting for development
// In production, use Redis or a proper rate limiting service
const requests = new Map<string, { count: number; lastReset: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest): { success: boolean; remaining: number } => {
    const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown';
    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();

    const record = requests.get(key);

    if (!record || now - record.lastReset > config.windowMs) {
      // Reset window
      requests.set(key, { count: 1, lastReset: now });
      return { success: true, remaining: config.maxRequests - 1 };
    }

    if (record.count >= config.maxRequests) {
      return { success: false, remaining: 0 };
    }

    record.count++;
    return { success: true, remaining: config.maxRequests - record.count };
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

// Helper to create rate limit response
export function createRateLimitResponse(remaining: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      retryAfter: '15 minutes',
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'Retry-After': '900', // 15 minutes in seconds
      },
    },
  );
}
