import { NextRequest, NextResponse } from 'next/server';
import { log, logApiRequest, logError, logSecurityEvent } from './logger';

// Temporary fallback functions to avoid OpenTelemetry imports during build
function createSpan<T>(_name: string, fn: () => Promise<T>): Promise<T> {
  // Simple fallback - just execute the function without tracing
  return fn();
}

function addSpanAttributes(_attributes: Record<string, string | number | boolean>): void {
  // No-op fallback when monitoring is disabled
}

export function withLogging(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: {
    routeName?: string;
    skipLogging?: boolean;
  },
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (options?.skipLogging === true) {
      return handler(request);
    }

    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    const routeName = options?.routeName ?? url.pathname;

    // Extract request metadata
    const userId = request.headers.get('x-user-id') ?? undefined;
    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

    // Log request start
    log.debug(`API Request Start: ${method} ${routeName}`, {
      requestId,
      method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userId,
      userAgent,
      ip,
    });

    try {
      // Execute handler with tracing
      const response = await createSpan(`api.${method.toLowerCase()}.${routeName}`, async () => {
        addSpanAttributes({
          'http.request_id': requestId,
          'http.user_agent': userAgent,
          'http.client_ip': ip,
          'user.id': userId ?? 'anonymous',
        });

        return handler(request);
      });

      // Calculate duration
      const duration = Date.now() - startTime;

      // Log successful response
      logApiRequest(method, routeName, response.status, duration, userId);

      // Add logging headers to response
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-response-time', duration.toString());

      // Log security events for specific status codes
      if (response.status === 401) {
        logSecurityEvent('unauthorized_access', 'medium', {
          method,
          path: routeName,
          ip,
          userId,
        });
      } else if (response.status === 403) {
        logSecurityEvent('forbidden_access', 'medium', {
          method,
          path: routeName,
          ip,
          userId,
        });
      } else if (response.status === 429) {
        logSecurityEvent('rate_limit_exceeded', 'low', {
          method,
          path: routeName,
          ip,
          userId,
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      logError(error as Error, `API ${method} ${routeName}`, {
        requestId,
        method,
        path: routeName,
        userId,
        ip,
        duration,
      });

      // Return error response
      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message:
            process.env.NODE_ENV === 'development' ? (error as Error).message : 'An error occurred',
          requestId,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'x-request-id': requestId,
            'x-response-time': duration.toString(),
          },
        },
      );
    }
  };
}

// Middleware to log request body (be careful with sensitive data)
export function logRequestBody<T = unknown>(
  handler: (request: NextRequest, body: T) => Promise<NextResponse>,
): (request: NextRequest) => Promise<NextResponse> {
  return withLogging(async (request: NextRequest) => {
    let body: T | null = null;

    try {
      const contentType = request.headers.get('content-type');

      if (contentType !== null && contentType.includes('application/json')) {
        const text = await request.text();
        body = JSON.parse(text) as T;

        // Redact sensitive fields
        const sanitizedBody = sanitizeRequestBody(body);

        log.debug('Request body', {
          body: sanitizedBody,
          contentType,
        });
      }
    } catch (error) {
      log.warn('Failed to parse request body', { error: (error as Error).message });
    }

    // Create new request with body
    const newRequest = new NextRequest(request.url, {
      method: request.method,
      headers: request.headers,
      body: body !== null ? JSON.stringify(body) : undefined,
    });

    return handler(newRequest, body as T);
  });
}

// Helper to sanitize sensitive data from logs
type SanitizableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SanitizableObject
  | SanitizableValue[];
interface SanitizableObject {
  [key: string]: SanitizableValue;
}

function sanitizeRequestBody<T>(body: T): T {
  // Type guard for objects
  const isObject = (val: unknown): val is Record<string, unknown> => {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  };
  if (body === null || body === undefined || !isObject(body)) {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];
  const sanitized = { ...body } as Record<string, unknown>;

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeRequestBody(sanitized[key]);
    }
  }

  return sanitized as T;
}
