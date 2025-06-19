import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // 認証状態を確認
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 保護されたルートの定義
  const protectedRoutes = ['/dashboard', '/settings', '/organization'];
  const authRoutes = ['/login', '/signup', '/reset-password'];
  const pathname = request.nextUrl.pathname;

  // 保護されたルートへのアクセスで未認証の場合
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 認証済みユーザーが認証ページにアクセスした場合
  if (authRoutes.some(route => pathname.startsWith(route)) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};