'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  name: string;
  isCompleted: boolean;
  isRequired: boolean;
}

interface EvaluationFormProgressProps {
  steps: Step[];
  currentStep: number;
  progress: number;
  onStepClick: (stepIndex: number) => void;
}

export function EvaluationFormProgress({
  steps,
  currentStep,
  progress,
  onStepClick,
}: EvaluationFormProgressProps): JSX.Element {
  const t = useTranslations('evaluations.form');

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('progress.title')}</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Step indicators */}
          <div className="flex justify-between text-xs">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex cursor-pointer flex-col items-center space-y-1',
                  index === currentStep ? 'font-medium text-blue-600' : 'text-gray-500',
                  step.isCompleted && 'text-green-600',
                )}
                onClick={() => onStepClick(index)}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs',
                    index === currentStep
                      ? 'border-blue-600 bg-blue-50'
                      : step.isCompleted
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300',
                  )}
                >
                  {step.isCompleted ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                </div>
                <span className="max-w-[80px] text-center">{step.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
