/**
 * Evaluation input form - Refactored step-based evaluation form
 * Broken down into smaller, focused components for better maintainability
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useEvaluationForm } from '@/hooks/use-evaluation-form';

// Components
import { EvaluationFormHeader } from './evaluation-form-header';
import { EvaluationFormProgress } from './evaluation-form-progress';
import { EvaluationFormContent } from './evaluation-form-content';
import { EvaluationFormNavigation } from './evaluation-form-navigation';
import { EvaluationFormLoading, InvalidStepError } from './evaluation-form-loading';

interface EvaluationFormProps {
  evaluationId: string;
}

export function EvaluationForm({ evaluationId }: EvaluationFormProps): JSX.Element {
  const {
    // State
    currentEvaluation,
    steps,
    currentStep,
    isLoading,
    isSaving,
    isSubmitting,
    isDirty,
    isOnline,
    lastSavedAt,
    submitError,
    autoSaveEnabled,

    // Computed
    progress,
    currentLocale,
    isReadOnly,
    currentStepData,

    // Actions
    nextStep,
    previousStep,
    goToStep,
    validateCurrentStep,
    canSubmit,
    handleSave,
    handleSubmit,
  } = useEvaluationForm({ evaluationId });

  // Loading state
  if (isLoading) {
    return <EvaluationFormLoading isLoading={true} />;
  }

  // No evaluation found
  if (currentEvaluation == null) {
    return <EvaluationFormLoading isLoading={false} hasError={true} />;
  }

  // Invalid step
  if (!currentStepData) {
    return <InvalidStepError show={true} />;
  }

  // Navigation handlers
  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <EvaluationFormHeader
        evaluation={
          (currentEvaluation as {
            type: 'SELF' | 'MANAGER' | 'PEER';
            evaluatee: { name: string };
            cycle: { name: string };
            status: string;
          }) ?? {
            type: 'SELF' as const,
            evaluatee: { name: 'Unknown' },
            cycle: { name: 'Unknown' },
            status: 'DRAFT',
          }
        }
        isOnline={isOnline}
        lastSavedAt={lastSavedAt}
        currentLocale={currentLocale}
      />

      {/* Progress */}
      <EvaluationFormProgress
        steps={steps}
        currentStep={currentStep}
        progress={progress}
        onStepClick={goToStep}
      />

      {/* Error display */}
      {submitError != null && submitError !== '' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Form content */}
      <EvaluationFormContent
        currentStep={currentStepData}
        evaluation={currentEvaluation}
        isReadOnly={isReadOnly}
      >
        {/* Navigation */}
        <EvaluationFormNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          isReadOnly={isReadOnly}
          isDirty={isDirty}
          isSaving={isSaving}
          isSubmitting={isSubmitting}
          autoSaveEnabled={autoSaveEnabled}
          canSubmit={canSubmit()}
          canGoNext={validateCurrentStep()}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSave={handleSave}
          onSubmit={handleSubmit}
        />
      </EvaluationFormContent>
    </div>
  );
}
