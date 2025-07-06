'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { EvaluationOverviewStep } from './form-steps/overview-step';
import { EvaluationCompetenciesStep } from './form-steps/competencies-step';
import { EvaluationGoalsStep } from './form-steps/goals-step';
import { EvaluationReviewStep } from './form-steps/review-step';

interface Step {
  id: string;
  name: string;
  isCompleted: boolean;
  isRequired: boolean;
}

interface EvaluationFormContentProps {
  currentStep: Step;
  evaluation: unknown; // Type this properly based on your evaluation type
  isReadOnly: boolean;
  children: React.ReactNode; // Navigation component
}

export function EvaluationFormContent({
  currentStep,
  evaluation,
  isReadOnly,
  children,
}: EvaluationFormContentProps): JSX.Element {
  const t = useTranslations('evaluations.form');

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'overview':
        return <EvaluationOverviewStep evaluation={evaluation as never} isReadOnly={isReadOnly} />;
      case 'competencies':
        return (
          <EvaluationCompetenciesStep evaluation={evaluation as never} isReadOnly={isReadOnly} />
        );
      case 'goals':
        return <EvaluationGoalsStep evaluation={evaluation as never} isReadOnly={isReadOnly} />;
      case 'review':
        return <EvaluationReviewStep evaluation={evaluation as never} isReadOnly={isReadOnly} />;
      default:
        return <div>{t('errors.unknownStep')}</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{currentStep.name}</span>
          {currentStep.isRequired && (
            <Badge variant="outline" className="text-red-600">
              {t('labels.required')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step content */}
        {renderStepContent()}

        {/* Navigation */}
        {children}
      </CardContent>
    </Card>
  );
}
