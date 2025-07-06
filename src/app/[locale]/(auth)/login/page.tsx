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
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
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
        '2FA_REQUIRED': 'Two-factor authentication required. Please enter your 6-digit code.',
        INVALID_2FA_TOKEN: 'Invalid two-factor authentication code. Please try again.',
        Default: t('error'),
      };
      setError(
        (urlError && urlError in errorMessages
          ? errorMessages[urlError]
          : errorMessages['Default']) as string,
      );
    }
  }, [searchParams, t]);

  // Check if user requires 2FA
  const checkTwoFactorRequired = async (userEmail: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/2fa/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (response.ok) {
        const data = (await response.json()) as { twoFactorEnabled: boolean };
        return data.twoFactorEnabled;
      }
    } catch {
      // If check fails, proceed without 2FA requirement
    }
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, check if this user requires 2FA
      if (!requires2FA) {
        const needsTwoFactor = await checkTwoFactorRequired(email);
        if (needsTwoFactor) {
          setRequires2FA(true);
          setLoading(false);
          setError('Two-factor authentication required. Please enter your 6-digit code.');
          return;
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        twoFactorToken: requires2FA ? twoFactorToken : undefined,
        redirect: false,
      });

      if (result?.error != null) {
        // Handle specific 2FA errors
        if (result.error === 'CredentialsSignin') {
          // This could be a 2FA error, check the actual error from our auth config
          if (!requires2FA) {
            setError(t('error'));
          } else {
            setError('Invalid two-factor authentication code. Please try again.');
            setTwoFactorToken(''); // Clear the 2FA token field
          }
        } else {
          setError(t('error'));
        }
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
                placeholder={t('emailPlaceholder')}
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
            {requires2FA && (
              <div className="space-y-2">
                <Label htmlFor="twoFactorToken">Two-Factor Authentication Code</Label>
                <Input
                  id="twoFactorToken"
                  type="text"
                  placeholder="123456"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={loading}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}
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
