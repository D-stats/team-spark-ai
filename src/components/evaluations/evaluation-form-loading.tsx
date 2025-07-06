'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EvaluationFormLoadingProps {
  isLoading: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export function EvaluationFormLoading({
  isLoading,
  hasError = false,
  errorMessage,
}: EvaluationFormLoadingProps): JSX.Element | null {
  const t = useTranslations('evaluations.form');

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">{t('loading.data')}</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{errorMessage ?? t('errors.notFound')}</AlertDescription>
      </Alert>
    );
  }

  return null;
}

interface InvalidStepErrorProps {
  show: boolean;
}

export function InvalidStepError({ show }: InvalidStepErrorProps): JSX.Element | null {
  const t = useTranslations('evaluations.form');

  if (!show) return null;

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{t('errors.invalidStep')}</AlertDescription>
    </Alert>
  );
}
