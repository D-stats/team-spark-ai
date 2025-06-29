/**
 * 評価フロー用Zustandストア
 * 評価入力フォームの状態管理とオフライン対応
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  EvaluationWithDetails,
  CompetencyRating,
  SaveEvaluationRequest,
  Result,
  ApiResponse,
} from '@/types/api';
import { EvaluationStatus } from '@prisma/client';

// ================
// 状態型定義
// ================

export interface EvaluationFormData {
  // 基本情報
  overallRating?: number;
  overallComments?: string;
  strengths?: string;
  improvements?: string;
  careerGoals?: string;
  developmentPlan?: string;

  // コンピテンシー評価
  competencyRatings: Record<
    string,
    {
      competencyId: string;
      rating?: number;
      comments?: string;
      behaviors: string[];
      examples?: string;
      improvementAreas?: string;
    }
  >;
}

export interface EvaluationFormStep {
  id: string;
  name: string;
  isCompleted: boolean;
  isRequired: boolean;
  order: number;
}

export interface EvaluationFormState {
  // 現在の評価
  currentEvaluation: EvaluationWithDetails | null;

  // フォームデータ
  formData: EvaluationFormData;

  // ステップ管理
  steps: EvaluationFormStep[];
  currentStep: number;

  // 状態管理
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  lastSavedAt: Date | null;
  autoSaveEnabled: boolean;

  // エラー管理
  errors: Record<string, string>;
  submitError: string | null;

  // オフライン対応
  isOnline: boolean;
  pendingSaves: SaveEvaluationRequest[];
}

export interface EvaluationFormActions {
  // データ読み込み
  loadEvaluation: (evaluationId: string) => Promise<Result<EvaluationWithDetails>>;
  clearEvaluation: () => void;

  // フォームデータ更新
  updateOverallRating: (rating: number) => void;
  updateOverallComments: (comments: string) => void;
  updateStrengths: (strengths: string) => void;
  updateImprovements: (improvements: string) => void;
  updateCareerGoals: (goals: string) => void;
  updateDevelopmentPlan: (plan: string) => void;
  updateCompetencyRating: (competencyId: string, updates: Partial<CompetencyRating>) => void;

  // ステップ管理
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  validateCurrentStep: () => boolean;
  completeStep: (stepId: string) => void;

  // 保存・送信
  saveDraft: () => Promise<Result<void>>;
  submitEvaluation: () => Promise<Result<void>>;
  enableAutoSave: () => void;
  disableAutoSave: () => void;

  // エラー管理
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;

  // ユーティリティ
  reset: () => void;
  getProgress: () => number;
  canSubmit: () => boolean;

  // オフライン対応
  setOnlineStatus: (isOnline: boolean) => void;
  syncPendingSaves: () => Promise<void>;
}

export type EvaluationStore = EvaluationFormState & EvaluationFormActions;

// ================
// 初期状態
// ================

const initialSteps: EvaluationFormStep[] = [
  {
    id: 'overview',
    name: '概要',
    isCompleted: false,
    isRequired: true,
    order: 0,
  },
  {
    id: 'competencies',
    name: 'コンピテンシー評価',
    isCompleted: false,
    isRequired: true,
    order: 1,
  },
  {
    id: 'goals',
    name: '目標・開発計画',
    isCompleted: false,
    isRequired: false,
    order: 2,
  },
  {
    id: 'review',
    name: '確認・送信',
    isCompleted: false,
    isRequired: true,
    order: 3,
  },
];

const initialState: EvaluationFormState = {
  currentEvaluation: null,
  formData: {
    competencyRatings: {},
  },
  steps: initialSteps,
  currentStep: 0,
  isLoading: false,
  isSaving: false,
  isSubmitting: false,
  isDirty: false,
  lastSavedAt: null,
  autoSaveEnabled: true,
  errors: {},
  submitError: null,
  isOnline: true,
  pendingSaves: [],
};

// ================
// ストア作成
// ================

export const useEvaluationStore = create<EvaluationStore>()(
  subscribeWithSelector(
    persist(
      immer<EvaluationStore>((set, get) => ({
        ...initialState,

        // データ読み込み
        loadEvaluation: async (evaluationId: string) => {
          set((state) => {
            state.isLoading = true;
            state.errors = {};
          });

          try {
            const response = await fetch(`/api/evaluations/${evaluationId}`);
            const result = (await response.json()) as ApiResponse<EvaluationWithDetails>;

            if (!result.success || !result.data) {
              set((state) => {
                state.isLoading = false;
              });
              return {
                success: false as const,
                error: result.error ?? { code: 'NO_DATA', message: 'No data returned' },
              };
            }

            const evaluation = result.data;

            set((state) => {
              state.currentEvaluation = evaluation;
              state.isLoading = false;

              // フォームデータを評価データで初期化
              state.formData = {
                overallRating: evaluation.overallRating ?? undefined,
                overallComments: evaluation.overallComments ?? '',
                strengths: evaluation.strengths ?? '',
                improvements: evaluation.improvements ?? '',
                careerGoals: evaluation.careerGoals ?? '',
                developmentPlan: evaluation.developmentPlan ?? '',
                competencyRatings: evaluation.competencyRatings.reduce(
                  (acc, rating) => {
                    acc[rating.competencyId] = {
                      competencyId: rating.competencyId,
                      rating: rating.rating ?? undefined,
                      comments: rating.comments ?? '',
                      behaviors: rating.behaviors,
                      examples: rating.examples ?? '',
                      improvementAreas: rating.improvementAreas ?? '',
                    };
                    return acc;
                  },
                  {} as Record<
                    string,
                    {
                      competencyId: string;
                      rating?: number;
                      comments?: string;
                      behaviors: string[];
                      examples?: string;
                      improvementAreas?: string;
                    }
                  >,
                ),
              };

              state.isDirty = false;
            });

            return { success: true, data: evaluation };
          } catch (error) {
            set((state) => {
              state.isLoading = false;
            });
            return {
              success: false,
              error: { code: 'LOAD_ERROR', message: '評価データの読み込みに失敗しました' },
            } as Result<EvaluationWithDetails>;
          }
        },

        clearEvaluation: () => {
          set((state) => {
            state.currentEvaluation = null;
            state.formData = { competencyRatings: {} };
            state.currentStep = 0;
            state.steps = initialSteps.map((step) => ({ ...step, isCompleted: false }));
            state.isDirty = false;
            state.errors = {};
            state.submitError = null;
            state.lastSavedAt = null;
          });
        },

        // フォームデータ更新
        updateOverallRating: (rating: number) => {
          set((state) => {
            state.formData.overallRating = rating;
            state.isDirty = true;
            if (state.errors['overallRating'] !== undefined) {
              delete state.errors['overallRating'];
            }
          });
        },

        updateOverallComments: (comments: string) => {
          set((state) => {
            state.formData.overallComments = comments;
            state.isDirty = true;
            if (state.errors['overallComments'] !== undefined) {
              delete state.errors['overallComments'];
            }
          });
        },

        updateStrengths: (strengths: string) => {
          set((state) => {
            state.formData.strengths = strengths;
            state.isDirty = true;
          });
        },

        updateImprovements: (improvements: string) => {
          set((state) => {
            state.formData.improvements = improvements;
            state.isDirty = true;
          });
        },

        updateCareerGoals: (goals: string) => {
          set((state) => {
            state.formData.careerGoals = goals;
            state.isDirty = true;
          });
        },

        updateDevelopmentPlan: (plan: string) => {
          set((state) => {
            state.formData.developmentPlan = plan;
            state.isDirty = true;
          });
        },

        updateCompetencyRating: (competencyId: string, updates: Partial<CompetencyRating>) => {
          set((state) => {
            if (!state.formData.competencyRatings[competencyId]) {
              state.formData.competencyRatings[competencyId] = {
                competencyId,
                rating: undefined,
                comments: undefined,
                behaviors: [],
                examples: undefined,
                improvementAreas: undefined,
              };
            }

            Object.assign(state.formData.competencyRatings[competencyId], updates);
            state.isDirty = true;

            // エラーをクリア
            if (state.errors[`competency_${competencyId}`] !== undefined) {
              delete state.errors[`competency_${competencyId}`];
            }
          });
        },

        // ステップ管理
        goToStep: (step: number) => {
          const state = get();
          if (step >= 0 && step < state.steps.length) {
            set((draft) => {
              draft.currentStep = step;
            });
          }
        },

        nextStep: () => {
          const state = get();
          if (state.validateCurrentStep() && state.currentStep < state.steps.length - 1) {
            set((draft) => {
              draft.currentStep += 1;
            });
          }
        },

        previousStep: () => {
          const state = get();
          if (state.currentStep > 0) {
            set((draft) => {
              draft.currentStep -= 1;
            });
          }
        },

        validateCurrentStep: () => {
          const state = get();
          const currentStepData = state.steps[state.currentStep];
          if (!currentStepData) return false;

          if (!currentStepData.isRequired) return true;

          switch (currentStepData.id) {
            case 'overview':
              return (
                state.formData.overallRating !== undefined &&
                state.formData.overallRating !== null &&
                state.formData.overallComments !== undefined &&
                state.formData.overallComments.trim() !== ''
              );
            case 'competencies':
              return (
                Object.keys(state.formData.competencyRatings).length > 0 &&
                Object.values(state.formData.competencyRatings).every(
                  (rating) =>
                    rating.rating !== undefined &&
                    rating.rating !== null &&
                    rating.comments !== undefined &&
                    rating.comments.trim() !== '' &&
                    rating.behaviors.length > 0,
                )
              );
            case 'review':
              return state.canSubmit();
            default:
              return true;
          }
        },

        completeStep: (stepId: string) => {
          set((state) => {
            const step = state.steps.find((s) => s.id === stepId);
            if (step) {
              step.isCompleted = true;
            }
          });
        },

        // 保存・送信
        saveDraft: async () => {
          const state = get();
          if (!state.currentEvaluation) {
            return {
              success: false,
              error: { code: 'NO_EVALUATION', message: '評価データがありません' },
            };
          }

          set((draft) => {
            draft.isSaving = true;
          });

          try {
            const saveData: SaveEvaluationRequest = {
              ...state.formData,
              competencyRatings: Object.values(state.formData.competencyRatings)
                .filter((rating) => rating.rating !== undefined)
                .map((rating) => ({
                  ...rating,
                  rating: rating.rating as number,
                })),
              isDraft: true,
            };

            if (!state.isOnline) {
              // オフラインの場合はpendingSavesに追加
              set((draft) => {
                draft.pendingSaves.push(saveData);
                draft.isSaving = false;
                draft.isDirty = false;
                draft.lastSavedAt = new Date();
              });
              return { success: true as const, data: undefined };
            }

            const response = await fetch(`/api/evaluations/${state.currentEvaluation.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(saveData),
            });

            const result = (await response.json()) as ApiResponse<void>;

            set((draft) => {
              draft.isSaving = false;

              if (result.success === true) {
                draft.isDirty = false;
                draft.lastSavedAt = new Date();
              }
            });

            if (result.success) {
              return { success: true as const, data: undefined };
            } else {
              return {
                success: false as const,
                error: result.error ?? { code: 'SAVE_ERROR', message: '保存に失敗しました' },
              };
            }
          } catch (error) {
            set((draft) => {
              draft.isSaving = false;
            });
            return { success: false, error: { code: 'SAVE_ERROR', message: '保存に失敗しました' } };
          }
        },

        submitEvaluation: async () => {
          const state = get();
          if (!state.currentEvaluation || !state.canSubmit()) {
            return {
              success: false,
              error: { code: 'INVALID_SUBMISSION', message: '送信できません' },
            };
          }

          set((draft) => {
            draft.isSubmitting = true;
            draft.submitError = null;
          });

          try {
            const submitData = {
              ...state.formData,
              competencyRatings: Object.values(state.formData.competencyRatings).filter(
                (rating) =>
                  rating.rating !== undefined &&
                  rating.rating !== null &&
                  rating.comments !== undefined &&
                  rating.comments.trim() !== '' &&
                  rating.behaviors.length > 0,
              ),
              isDraft: false,
            };

            const response = await fetch(`/api/evaluations/${state.currentEvaluation.id}/submit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(submitData),
            });

            const result = (await response.json()) as ApiResponse<void>;

            set((draft) => {
              draft.isSubmitting = false;

              if (result.success === true) {
                draft.isDirty = false;
                draft.lastSavedAt = new Date();
                if (draft.currentEvaluation) {
                  draft.currentEvaluation.status = EvaluationStatus.SUBMITTED;
                }
              } else {
                draft.submitError = result.error?.message ?? '送信に失敗しました';
              }
            });

            if (result.success) {
              return { success: true as const, data: undefined };
            } else {
              return {
                success: false as const,
                error: result.error ?? { code: 'SUBMIT_ERROR', message: '送信に失敗しました' },
              };
            }
          } catch (error) {
            set((draft) => {
              draft.isSubmitting = false;
              draft.submitError = '送信に失敗しました';
            });
            return {
              success: false,
              error: { code: 'SUBMIT_ERROR', message: '送信に失敗しました' },
            };
          }
        },

        enableAutoSave: () => {
          set((state) => {
            state.autoSaveEnabled = true;
          });
        },

        disableAutoSave: () => {
          set((state) => {
            state.autoSaveEnabled = false;
          });
        },

        // エラー管理
        setError: (field: string, message: string) => {
          set((state) => {
            state.errors[field] = message;
          });
        },

        clearError: (field: string) => {
          set((state) => {
            delete state.errors[field];
          });
        },

        clearAllErrors: () => {
          set((state) => {
            state.errors = {};
            state.submitError = null;
          });
        },

        // ユーティリティ
        reset: () => {
          set(initialState);
        },

        getProgress: () => {
          const state = get();
          const completedSteps = state.steps.filter((step) => step.isCompleted).length;
          return (completedSteps / state.steps.length) * 100;
        },

        canSubmit: () => {
          const state = get();
          return (
            state.formData.overallRating !== undefined &&
            state.formData.overallRating !== null &&
            state.formData.overallComments !== undefined &&
            state.formData.overallComments.trim() !== '' &&
            Object.keys(state.formData.competencyRatings).length > 0 &&
            Object.values(state.formData.competencyRatings).every(
              (rating) =>
                rating.rating !== undefined &&
                rating.rating !== null &&
                rating.comments !== undefined &&
                rating.comments.trim() !== '' &&
                rating.behaviors.length > 0,
            )
          );
        },

        // オフライン対応
        setOnlineStatus: (isOnline: boolean) => {
          set((state) => {
            state.isOnline = isOnline;
          });

          if (isOnline) {
            // オンラインになったら保留中の保存を同期
            get().syncPendingSaves();
          }
        },

        syncPendingSaves: async () => {
          const state = get();
          if (!state.currentEvaluation || state.pendingSaves.length === 0) return;

          for (const saveData of state.pendingSaves) {
            try {
              await fetch(`/api/evaluations/${state.currentEvaluation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saveData),
              });
            } catch (error) {
              // Keep console.error for client-side error tracking
              console.error('Failed to sync save:', error);
              // TODO: Consider integrating with error tracking service (e.g., Sentry)
            }
          }

          set((draft) => {
            draft.pendingSaves = [];
          });
        },
      })),
      {
        name: 'evaluation-form-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          formData: state.formData,
          currentStep: state.currentStep,
          steps: state.steps,
          lastSavedAt: state.lastSavedAt,
          autoSaveEnabled: state.autoSaveEnabled,
          pendingSaves: state.pendingSaves,
        }),
      },
    ),
  ),
);

// ================
// オートセーブフック
// ================

export function useAutoSave(): void {
  // isDirtyとautoSaveEnabledの変更を監視
  useEvaluationStore.subscribe(
    (state) => ({ isDirty: state.isDirty, autoSaveEnabled: state.autoSaveEnabled }),
    (curr, prev) => {
      if (curr.isDirty && curr.autoSaveEnabled && !prev.isDirty) {
        // 5秒後に自動保存
        setTimeout(() => {
          const currentState = useEvaluationStore.getState();
          if (currentState.isDirty && !currentState.isSaving) {
            currentState.saveDraft();
          }
        }, 5000);
      }
    },
    {
      equalityFn: (a, b) => a.isDirty === b.isDirty && a.autoSaveEnabled === b.autoSaveEnabled,
    },
  );

  // No return value needed for this hook
}
