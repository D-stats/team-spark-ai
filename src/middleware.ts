import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';
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

// Helper to check if route requires authentication
function requiresAuth(pathname: string): boolean {
  // Extract locale from pathname to get the actual route
  const pathWithoutLocale = pathname.replace(/^\/(en|ja)/, '') || '/';

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard'];

  return protectedRoutes.some((route) => pathWithoutLocale.startsWith(route));
}

// Helper to check if route is auth-related
function isAuthRoute(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ja)/, '') || '/';
  const authRoutes = ['/login', '/signup'];

  return authRoutes.some((route) => pathWithoutLocale.startsWith(route));
}

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

  // Check if the pathname already includes a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (!pathnameHasLocale) {
    // No locale in URL, redirect to URL with locale
    // We don't auto-detect from Accept-Language header to avoid automatic redirects
    // Users can change language through profile settings
    const locale = defaultLocale;
    const newUrl = new URL(`/${locale}${pathname}`, request.url);

    // Preserve query parameters
    newUrl.search = request.nextUrl.search;

    return NextResponse.redirect(newUrl);
  }

  // Apply internationalization middleware for locale validation
  response = intlMiddleware(request);

  // Authentication check for protected routes
  if (requiresAuth(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token == null) {
      // Extract locale from pathname for proper redirect
      const locale = pathname.split('/')[1] ?? defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);

      // Add return URL as query parameter
      loginUrl.searchParams.set('callbackUrl', request.url);

      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token != null) {
      // Try to get user's preferred locale from database
      let userLocale: string = defaultLocale;

      try {
        if (typeof token.id === 'string') {
          // Dynamically import prisma to avoid edge runtime issues
          const { prisma } = await import('@/lib/prisma');
          const user = await prisma.user.findUnique({
            where: { id: token.id },
            select: { locale: true },
          });

          if (
            user?.locale !== null &&
            user?.locale !== undefined &&
            user?.locale !== '' &&
            locales.includes(user.locale as 'en' | 'ja')
          ) {
            userLocale = user.locale;
          }
        }
      } catch (error) {
        // Fallback to current locale if database query fails
        const currentLocale = pathname.split('/')[1];
        userLocale =
          currentLocale !== null &&
          currentLocale !== undefined &&
          currentLocale !== '' &&
          locales.includes(currentLocale as 'en' | 'ja')
            ? currentLocale
            : defaultLocale;
      }

      const dashboardUrl = new URL(`/${userLocale}/dashboard`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

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
