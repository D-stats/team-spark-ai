'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EvaluationType } from '@prisma/client';

interface EvaluationFormHeaderProps {
  evaluation: {
    type: EvaluationType;
    evaluatee: { name: string };
    cycle: { name: string };
    status: string;
  };
  isOnline: boolean;
  lastSavedAt?: string;
  currentLocale: string;
}

export function EvaluationFormHeader({
  evaluation,
  isOnline,
  lastSavedAt,
  currentLocale,
}: EvaluationFormHeaderProps): JSX.Element {
  const router = useRouter();
  const t = useTranslations('evaluations.form');

  const getEvaluationTypeLabel = (type: EvaluationType): string => {
    switch (type) {
      case 'SELF':
        return t('types.self');
      case 'MANAGER':
        return t('types.manager');
      case 'PEER':
        return t('types.peer');
      default:
        return t('types.default');
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'DRAFT':
        return t('status.draft');
      case 'SUBMITTED':
        return t('status.submitted');
      case 'REVIEWED':
        return t('status.reviewed');
      case 'SHARED':
        return t('status.shared');
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary';
      case 'SUBMITTED':
        return 'default';
      case 'REVIEWED':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${currentLocale}/evaluations`)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('actions.back')}</span>
        </Button>

        <div>
          <h1 className="text-2xl font-bold">{getEvaluationTypeLabel(evaluation.type)}</h1>
          <p className="text-gray-600">
            {evaluation.evaluatee.name} - {evaluation.cycle.name}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Online status */}
        <div className="flex items-center space-x-1 text-sm">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-green-600">{t('status.online')}</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-orange-600" />
              <span className="text-orange-600">{t('status.offline')}</span>
            </>
          )}
        </div>

        {/* Save status */}
        {lastSavedAt != null && lastSavedAt !== '' && (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {new Date(lastSavedAt).toLocaleTimeString(
                currentLocale === 'ja' ? 'ja-JP' : 'en-US',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )}{' '}
              {t('status.saved')}
            </span>
          </div>
        )}

        {/* Evaluation status */}
        <Badge
          variant={
            getStatusVariant(evaluation.status) as
              | 'default'
              | 'secondary'
              | 'destructive'
              | 'outline'
          }
        >
          {getStatusLabel(evaluation.status)}
        </Badge>
      </div>
    </div>
  );
}
