import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // Always show locale in URL for clarity and SEO
  localeDetection: false, // We handle detection manually without cookies
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip internationalization for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.includes('/_next') ||
    pathname.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Check if the pathname already includes a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (!pathnameHasLocale) {
    // No locale in URL, redirect to URL with locale
    // We don't auto-detect from Accept-Language header to avoid automatic redirects
    // The client-side LanguageInitializer will handle suggestions
    const locale = defaultLocale;
    const newUrl = new URL(`/${locale}${pathname}`, request.url);

    // Preserve query parameters
    newUrl.search = request.nextUrl.search;

    return NextResponse.redirect(newUrl);
  }

  // Apply internationalization middleware for locale validation
  return intlMiddleware(request);
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
