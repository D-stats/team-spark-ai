'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useEvaluationStore, useAutoSave } from '@/stores/evaluation.store';

interface UseEvaluationFormProps {
  evaluationId: string;
}

interface Step {
  id: string;
  name: string;
  isCompleted: boolean;
  isRequired: boolean;
}

interface UseEvaluationFormReturn {
  // State
  currentEvaluation: unknown;
  steps: Step[];
  currentStep: number;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  isOnline: boolean;
  lastSavedAt?: string;
  submitError?: string;
  autoSaveEnabled: boolean;

  // Computed
  progress: number;
  currentLocale: string;
  isReadOnly: boolean;
  currentStepData: Step | null;

  // Actions
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  validateCurrentStep: () => boolean;
  canSubmit: () => boolean;
  handleSave: () => Promise<void>;
  handleSubmit: () => Promise<void>;
  clearAllErrors: () => void;
}

export function useEvaluationForm({
  evaluationId,
}: UseEvaluationFormProps): UseEvaluationFormReturn {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] ?? 'en';

  const store = useEvaluationStore();
  useAutoSave(); // Enable auto-save functionality

  const {
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
    loadEvaluation,
    nextStep,
    previousStep,
    goToStep,
    validateCurrentStep,
    canSubmit,
    saveDraft,
    submitEvaluation,
    clearAllErrors,
    getProgress,
  } = store;

  // Load evaluation data on mount
  useEffect(() => {
    if (evaluationId) {
      void loadEvaluation(evaluationId);
    }
  }, [evaluationId, loadEvaluation]);

  // Computed values
  const progress = getProgress();
  const isReadOnly = currentEvaluation?.status !== 'DRAFT';
  const currentStepData = steps[currentStep];

  // Action handlers
  const handleSave = async (): Promise<void> => {
    await saveDraft();
  };

  const handleSubmit = async (): Promise<void> => {
    clearAllErrors();

    if (!canSubmit()) {
      return;
    }

    const result = await submitEvaluation();
    if (result.success) {
      router.push(`/${currentLocale}/evaluations`);
    }
  };

  return {
    // State
    currentEvaluation,
    steps: steps as Step[],
    currentStep,
    isLoading,
    isSaving,
    isSubmitting,
    isDirty,
    isOnline,
    lastSavedAt: lastSavedAt != null ? lastSavedAt.toISOString() : undefined,
    submitError: submitError != null && submitError !== '' ? submitError : undefined,
    autoSaveEnabled,

    // Computed
    progress,
    currentLocale,
    isReadOnly,
    currentStepData: currentStepData as Step | null,

    // Actions
    nextStep,
    previousStep,
    goToStep,
    validateCurrentStep,
    canSubmit,
    handleSave,
    handleSubmit,
    clearAllErrors,
  };
}
