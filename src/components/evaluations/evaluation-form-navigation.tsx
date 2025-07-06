'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Send, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EvaluationFormNavigationProps {
  currentStep: number;
  totalSteps: number;
  isReadOnly: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  autoSaveEnabled: boolean;
  canSubmit: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  onSubmit: () => void;
}

export function EvaluationFormNavigation({
  currentStep,
  totalSteps,
  isReadOnly,
  isDirty,
  isSaving,
  isSubmitting,
  autoSaveEnabled,
  canSubmit,
  canGoNext,
  onPrevious,
  onNext,
  onSave,
  onSubmit,
}: EvaluationFormNavigationProps): JSX.Element {
  const t = useTranslations('evaluations.form');
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="flex items-center justify-between border-t pt-6">
      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('navigation.previous')}</span>
        </Button>

        {!isLastStep && (
          <Button onClick={onNext} disabled={!canGoNext} className="flex items-center space-x-2">
            <span>{t('navigation.next')}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex space-x-3">
        {/* Auto-save indicator */}
        {autoSaveEnabled && isDirty && !isSaving && (
          <div className="flex items-center space-x-1 text-sm text-amber-600">
            <Clock className="h-4 w-4" />
            <span>{t('autoSave.pending')}</span>
          </div>
        )}

        {/* Saving indicator */}
        {isSaving && (
          <div className="flex items-center space-x-1 text-sm text-blue-600">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span>{t('autoSave.saving')}</span>
          </div>
        )}

        {!isReadOnly && (
          <>
            {/* Manual save */}
            <Button
              variant="outline"
              onClick={onSave}
              disabled={isSaving || !isDirty}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{t('actions.save')}</span>
            </Button>

            {/* Submit */}
            {isLastStep && (
              <Button
                onClick={onSubmit}
                disabled={!canSubmit || isSubmitting}
                className="flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{isSubmitting ? t('actions.submitting') : t('actions.submit')}</span>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
