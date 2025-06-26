import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Only show locale in URL when it's not the default
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip internationalization for API routes
  if (pathname.startsWith('/api')) {
    const { supabase, response } = createClient(request);
    return response;
  }

  // Apply internationalization middleware first
  const intlResponse = intlMiddleware(request);
  if (intlResponse) {
    // If intl middleware returns a response (redirect), use it
    return intlResponse;
  }

  // Get the locale from the pathname
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  const locale = pathnameHasLocale ? pathname.split('/')[1] : defaultLocale;
  const pathnameWithoutLocale = pathnameHasLocale
    ? pathname.slice(`/${locale}`.length)
    : pathname;

  // Authentication logic
  const { supabase, response } = createClient(request);

  // Check authentication status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected and auth routes (without locale prefix)
  const protectedRoutes = ['/dashboard', '/settings', '/organization'];
  const authRoutes = ['/login', '/signup', '/reset-password'];

  // Check if accessing protected route without authentication
  if (protectedRoutes.some(route => pathnameWithoutLocale.startsWith(route)) && !user) {
    const redirectUrl = new URL(`/${locale}/login`, request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some(route => pathnameWithoutLocale.startsWith(route)) && user) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
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