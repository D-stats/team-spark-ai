'use client';

import { useState } from 'react';
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
import { validatePassword, validatePasswordMatch } from '@/lib/validation/password';

export default function SignUpPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const t = useTranslations('auth.signup');
  const tValidation = useTranslations('errors.validation');
  const locale = useLocale();

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    const validation = validatePassword(newPassword);
    setPasswordErrors(validation.errors);

    // Check password match if confirm password has been entered
    if (confirmPassword) {
      setPasswordMismatch(!validatePasswordMatch(newPassword, confirmPassword));
    }
  };

  const handleConfirmPasswordChange = (newConfirmPassword: string) => {
    setConfirmPassword(newConfirmPassword);
    setPasswordMismatch(!validatePasswordMatch(password, newConfirmPassword));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    const passwordValidation = validatePassword(password);
    const passwordsMatch = validatePasswordMatch(password, confirmPassword);

    if (!passwordValidation.isValid) {
      setPasswordErrors(passwordValidation.errors);
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setPasswordMismatch(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? t('error'));
        return;
      }

      // Registration successful - redirect to login
      window.location.href = `/${locale}/login?message=registration-success`;
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
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            {error !== null && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t('nameLabel')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
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
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                disabled={loading}
                minLength={8}
                className={passwordErrors.length > 0 ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">{t('passwordHelp')}</p>
              {passwordErrors.length > 0 && (
                <div className="space-y-1">
                  {passwordErrors.map((errorKey) => (
                    <p key={errorKey} className="text-xs text-red-600">
                      {tValidation(errorKey)}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                required
                disabled={loading}
                minLength={8}
                className={passwordMismatch ? 'border-red-500' : ''}
              />
              {passwordMismatch && (
                <p className="text-xs text-red-600">{tValidation('passwordMismatch')}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={
                loading ||
                passwordErrors.length > 0 ||
                passwordMismatch ||
                !password ||
                !confirmPassword
              }
            >
              {loading ? t('submitting') : t('submitButton')}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {t('hasAccount')}{' '}
              <Link href={`/${locale}/login`} className="text-primary hover:underline">
                {t('loginLink')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
