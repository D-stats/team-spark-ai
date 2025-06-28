import { NextRequest, NextResponse } from 'next/server';

// Security headers based on OWASP recommendations
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.slack.com wss://wss-primary.slack.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '),

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Force HTTPS (only in production)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }),

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
};

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of Array.from(rateLimitMap.entries())) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}

export async function getRateLimitIdentifier(request: NextRequest): Promise<string> {
  // For now, use IP-based rate limiting
  // TODO: Add user-based rate limiting when auth is implemented
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = identifier.startsWith('user:') ? 1000 : 100;

  let record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitMap.set(identifier, record);
  }

  record.count++;
  const remaining = Math.max(0, maxRequests - record.count);
  const allowed = record.count <= maxRequests;

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
  };
}

export function applySecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function createRateLimitResponse(resetTime: number): NextResponse {
  return new NextResponse('Too Many Requests', {
    status: 429,
    headers: {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': resetTime.toString(),
      'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
    },
  });
}

export function addRateLimitHeaders(response: NextResponse, remaining: number, resetTime: number) {
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());
  return response;
}
