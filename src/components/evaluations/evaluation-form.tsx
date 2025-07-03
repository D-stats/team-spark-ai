/**
 * Evaluation input form - Step-based evaluation form
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useEvaluationStore, useAutoSave } from '@/stores/evaluation.store';
import { cn } from '@/lib/utils';

// Step components
import { EvaluationOverviewStep } from './form-steps/overview-step';
import { EvaluationCompetenciesStep } from './form-steps/competencies-step';
import { EvaluationGoalsStep } from './form-steps/goals-step';
import { EvaluationReviewStep } from './form-steps/review-step';

interface EvaluationFormProps {
  evaluationId: string;
}

export function EvaluationForm({ evaluationId }: EvaluationFormProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] ?? 'en';
  const store = useEvaluationStore();
  useAutoSave(); // オートセーブ機能を有効化

  const {
    currentEvaluation,
    steps,
    currentStep,
    isLoading,
    isSaving,
    isSubmitting,
    isDirty,
    lastSavedAt,
    autoSaveEnabled,
    submitError,
    isOnline,
    loadEvaluation,
    goToStep,
    nextStep,
    previousStep,
    validateCurrentStep,
    saveDraft,
    submitEvaluation,
    getProgress,
    canSubmit,
    clearAllErrors,
  } = store;

  // 評価データの読み込み
  useEffect(() => {
    if (evaluationId) {
      loadEvaluation(evaluationId);
    }
  }, [evaluationId, loadEvaluation]);

  // オンライン状態の監視
  useEffect(() => {
    const handleOnline = () => store.setOnlineStatus(true);
    const handleOffline = () => store.setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [store]);

  // 手動保存
  const handleSave = async () => {
    const result = await saveDraft();
    if (!result.success) {
      // Save failed
    }
  };

  // 送信処理
  const handleSubmit = async () => {
    clearAllErrors();

    if (!canSubmit()) {
      return;
    }

    const result = await submitEvaluation();
    if (result.success) {
      router.push(`/${currentLocale}/evaluations`);
    }
  };

  // ステップナビゲーション
  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">評価データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (!currentEvaluation) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>評価データが見つかりません。</AlertDescription>
      </Alert>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = getProgress();
  const isReadOnly = currentEvaluation.status !== 'DRAFT';

  if (!currentStepData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>無効なステップです。</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${currentLocale}/evaluations`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>戻る</span>
          </Button>

          <div>
            <h1 className="text-2xl font-bold">
              {currentEvaluation.type === 'SELF'
                ? '自己評価'
                : currentEvaluation.type === 'MANAGER'
                  ? '上司評価'
                  : currentEvaluation.type === 'PEER'
                    ? '同僚評価'
                    : '評価'}
            </h1>
            <p className="text-gray-600">
              {currentEvaluation.evaluatee.name} - {currentEvaluation.cycle.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* オンライン状態 */}
          <div className="flex items-center space-x-1 text-sm">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-green-600">オンライン</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-orange-600" />
                <span className="text-orange-600">オフライン</span>
              </>
            )}
          </div>

          {/* 保存状態 */}
          {lastSavedAt && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {new Date(lastSavedAt).toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                保存済み
              </span>
            </div>
          )}

          {/* 評価ステータス */}
          <Badge
            variant={
              currentEvaluation.status === 'DRAFT'
                ? 'secondary'
                : currentEvaluation.status === 'SUBMITTED'
                  ? 'default'
                  : currentEvaluation.status === 'REVIEWED'
                    ? 'outline'
                    : 'default'
            }
          >
            {currentEvaluation.status === 'DRAFT'
              ? '下書き'
              : currentEvaluation.status === 'SUBMITTED'
                ? '提出済み'
                : currentEvaluation.status === 'REVIEWED'
                  ? '承認済み'
                  : currentEvaluation.status === 'SHARED'
                    ? '共有済み'
                    : currentEvaluation.status}
          </Badge>
        </div>
      </div>

      {/* プログレスバー */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">進捗状況</span>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />

            {/* ステップ表示 */}
            <div className="flex justify-between text-xs">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex cursor-pointer flex-col items-center space-y-1',
                    index === currentStep ? 'font-medium text-blue-600' : 'text-gray-500',
                    step.isCompleted && 'text-green-600',
                  )}
                  onClick={() => goToStep(index)}
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

      {/* エラー表示 */}
      {submitError !== null && submitError !== undefined && submitError !== '' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* フォームコンテンツ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{currentStepData.name}</span>
            {currentStepData.isRequired && (
              <Badge variant="outline" className="text-red-600">
                必須
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ステップコンテンツ */}
          {currentStepData.id === 'overview' && (
            <EvaluationOverviewStep evaluation={currentEvaluation} isReadOnly={isReadOnly} />
          )}

          {currentStepData.id === 'competencies' && (
            <EvaluationCompetenciesStep evaluation={currentEvaluation} isReadOnly={isReadOnly} />
          )}

          {currentStepData.id === 'goals' && (
            <EvaluationGoalsStep evaluation={currentEvaluation} isReadOnly={isReadOnly} />
          )}

          {currentStepData.id === 'review' && (
            <EvaluationReviewStep evaluation={currentEvaluation} isReadOnly={isReadOnly} />
          )}

          {/* ナビゲーションボタン */}
          <div className="flex items-center justify-between border-t pt-6">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>前へ</span>
              </Button>

              {currentStep < steps.length - 1 && (
                <Button
                  onClick={handleNext}
                  disabled={!validateCurrentStep()}
                  className="flex items-center space-x-2"
                >
                  <span>次へ</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              {/* 自動保存インジケーター */}
              {autoSaveEnabled && isDirty && !isSaving && (
                <div className="flex items-center space-x-1 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>自動保存待機中...</span>
                </div>
              )}

              {isSaving && (
                <div className="flex items-center space-x-1 text-sm text-blue-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <span>保存中...</span>
                </div>
              )}

              {!isReadOnly && (
                <>
                  {/* 手動保存 */}
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>保存</span>
                  </Button>

                  {/* 送信 */}
                  {currentStep === steps.length - 1 && (
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit() || isSubmitting}
                      className="flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>{isSubmitting ? '送信中...' : '評価を送信'}</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
