'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslations, useLocale } from 'next-intl';

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('auth.login');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle URL error parameters (from NextAuth redirects)
  useEffect(() => {
    const urlError = searchParams.get('error');
    const sessionEnded = searchParams.get('sessionEnded');

    if (sessionEnded === 'true') {
      setError('Your session has been ended. Please log in again.');
    } else if (urlError !== null && urlError !== '') {
      // Map NextAuth error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        CredentialsSignin: t('error'),
        SessionRequired: 'Session expired. Please log in again.',
        AccessDenied: 'Access denied. Please check your credentials.',
        Verification: 'Verification failed. Please try again.',
        Default: t('error'),
      };
      setError(
        (urlError && urlError in errorMessages
          ? errorMessages[urlError]
          : errorMessages['Default']) as string,
      );
    }
  }, [searchParams, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error != null) {
        setError(t('error'));
        // Track failed login attempt
        fetch('/api/auth/track-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            success: false,
            failReason: 'Invalid credentials',
          }),
        }).catch(() => {
          // Silently fail - this is just for tracking
        });
      } else if (result?.ok === true) {
        // Track successful login attempt
        fetch('/api/auth/track-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            success: true,
          }),
        }).catch(() => {
          // Silently fail - this is just for tracking
        });

        // Fetch user's preferred locale and redirect accordingly
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const userData = (await response.json()) as { locale?: string };
            const userLocale = userData.locale ?? locale;

            // Check if there's a callback URL and adjust locale if needed
            const callbackUrl = searchParams.get('callbackUrl');
            if (callbackUrl !== null && callbackUrl !== '') {
              try {
                const url = new URL(callbackUrl);
                // Extract locale from callback URL and update it to user's preferred locale
                const pathParts = url.pathname.split('/');
                if (
                  pathParts[1] !== null &&
                  pathParts[1] !== undefined &&
                  pathParts[1] !== '' &&
                  (pathParts[1] === 'en' || pathParts[1] === 'ja')
                ) {
                  pathParts[1] = userLocale;
                  url.pathname = pathParts.join('/');
                  router.push(url.pathname + url.search);
                } else {
                  router.push(`/${userLocale}${url.pathname}${url.search}`);
                }
              } catch {
                // If callback URL is invalid, redirect to dashboard
                router.push(`/${userLocale}/dashboard`);
              }
            } else {
              router.push(`/${userLocale}/dashboard`);
            }
          } else {
            // Fallback to current locale if profile fetch fails
            const callbackUrl = searchParams.get('callbackUrl');
            if (callbackUrl !== null && callbackUrl !== '') {
              router.push(callbackUrl);
            } else {
              router.push(`/${locale}/dashboard`);
            }
          }
        } catch {
          // Fallback to current locale if profile fetch fails
          const callbackUrl = searchParams.get('callbackUrl');
          if (callbackUrl !== null && callbackUrl !== '') {
            router.push(callbackUrl);
          } else {
            router.push(`/${locale}/dashboard`);
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">{t('title')}</CardTitle>
          <CardDescription className="text-center">{t('subtitle')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error !== null && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('submitting') : t('submitButton')}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {t('noAccount')}{' '}
              <Link href={`/${locale}/signup`} className="text-primary hover:underline">
                {t('signUpLink')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
