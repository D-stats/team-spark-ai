import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, type Locale } from '@/i18n/config';
import {
  applySecurityHeaders,
  checkRateLimit,
  getRateLimitIdentifier,
  createRateLimitResponse,
  addRateLimitHeaders,
} from '@/middleware/security';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // Always show locale in URL for clarity and SEO
  localeDetection: false, // We handle detection manually without cookies
});

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  let response: NextResponse;

  // Handle API routes with security features
  if (pathname.startsWith('/api')) {
    response = NextResponse.next();

    // Apply security headers
    applySecurityHeaders(response);

    // Apply rate limiting (skip for certain endpoints)
    const skipRateLimitPaths = ['/api/health', '/api/openapi.json'];
    if (!skipRateLimitPaths.includes(pathname)) {
      const identifier = await getRateLimitIdentifier(request);
      const { allowed, remaining, resetTime } = checkRateLimit(identifier);

      if (!allowed) {
        return createRateLimitResponse(resetTime);
      }

      // Add rate limit headers to response
      addRateLimitHeaders(response, remaining, resetTime);
    }

    // CORS configuration
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ];

    if (origin !== null && origin !== '' && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    return response;
  }

  // Skip internationalization for static files
  if (pathname.includes('/_next') || pathname.includes('/favicon.ico')) {
    response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // Parse the path to check for locale
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];

  // Check if the first segment is a valid locale
  if (firstSegment !== undefined && locales.includes(firstSegment as Locale)) {
    // Valid locale found, proceed with normal processing
    // The intlMiddleware will handle the rest
  } else if (firstSegment !== undefined && firstSegment.length === 2) {
    // Looks like a locale code (2 characters) but not valid, redirect to default locale with rest of path
    const restOfPath = pathSegments.slice(1).join('/');
    const newUrl = new URL(`/${defaultLocale}${restOfPath ? `/${restOfPath}` : ''}`, request.url);

    // Preserve query parameters
    newUrl.search = request.nextUrl.search;

    return NextResponse.redirect(newUrl);
  } else {
    // No valid locale at start, redirect to URL with default locale
    // We don't auto-detect from Accept-Language header to avoid automatic redirects
    // The client-side LanguageInitializer will handle suggestions
    const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url);

    // Preserve query parameters
    newUrl.search = request.nextUrl.search;

    return NextResponse.redirect(newUrl);
  }

  // Apply internationalization middleware for locale validation
  response = intlMiddleware(request);

  // Apply security headers to all responses
  if (response instanceof NextResponse) {
    applySecurityHeaders(response);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - files with extensions (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
