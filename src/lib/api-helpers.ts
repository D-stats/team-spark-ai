import { NextRequest, NextResponse } from 'next/server';
import {
  apiRateLimit,
  authRateLimit as _authRateLimit,
  RateLimitResult as _RateLimitResult,
} from './rate-limit';
import { createErrorResponse } from './openapi/validator';
import { logError } from './logger';
import { withAdminAuth } from './auth/admin-middleware';
import { AuthUser } from './auth/rbac';

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: {
    limit?: number;
    rateLimiter?: typeof apiRateLimit;
  },
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const rateLimiter = options?.rateLimiter ?? apiRateLimit;
    const limit = options?.limit ?? 30;

    const result = rateLimiter.check(request, limit);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.reset).toISOString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    const response = await handler(request);

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

    return response;
  };
}

export function withAuth(
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    // TODO: Implement proper authentication check
    // For now, this is a placeholder
    const authHeader = request.headers.get('authorization');

    if (
      authHeader === null ||
      authHeader === undefined ||
      authHeader.length === 0 ||
      !authHeader.startsWith('Bearer ')
    ) {
      return createErrorResponse('Unauthorized', 401);
    }

    // TODO: Verify JWT token and extract user ID
    authHeader.substring(7); // TODO: Verify JWT token
    const userId = 'placeholder-user-id'; // This should be extracted from the token

    return handler(request, userId);
  };
}

export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      logError(error as Error, 'API Error in withErrorHandler');

      if (error instanceof Error) {
        return createErrorResponse(error.message, 500);
      }

      return createErrorResponse('Internal Server Error', 500);
    }
  };
}

// Combine multiple middleware
type RequestHandler = (request: NextRequest) => Promise<NextResponse>;
type Middleware = (handler: RequestHandler) => RequestHandler;

export function withMiddleware(
  handler: RequestHandler,
  ...middleware: Middleware[]
): RequestHandler {
  return middleware.reverse().reduce((acc, fn) => fn(acc), handler);
}

// Export admin auth middleware for easy access
export { withAdminAuth };

// Enhanced auth helper that provides user object
export function withAuthUser(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    // TODO: Implement proper authentication check and return user object
    // This is a placeholder implementation
    const authHeader = request.headers.get('authorization');

    if (
      authHeader === null ||
      authHeader === undefined ||
      authHeader.length === 0 ||
      !authHeader.startsWith('Bearer ')
    ) {
      return createErrorResponse('Unauthorized', 401);
    }

    // TODO: Verify JWT token and extract user information
    // For now, return a placeholder user
    const user: AuthUser = {
      id: 'placeholder-user-id',
      email: 'placeholder@example.com',
      name: 'Placeholder User',
      organizationId: 'placeholder-org-id',
      role: 'MEMBER' as any,
      isActive: true,
    };

    return handler(request, user);
  };
}

// Convenience function for admin API routes
export function withAdminMiddleware(
  handler: (request: NextRequest, user: AuthUser, context?: any) => Promise<NextResponse>,
  options?: Parameters<typeof withAdminAuth>[1],
) {
  return withRateLimit(withErrorHandler(withAdminAuth(handler, options)));
}
