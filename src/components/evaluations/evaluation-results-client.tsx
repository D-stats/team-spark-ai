/**
 * 評価結果表示クライアントコンポーネント
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { EvaluationResults } from '@/components/evaluations/evaluation-results';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EvaluationWithDetails } from '@/types/api';
import { getErrorMessage } from '@/lib/errors';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface EvaluationResultsClientProps {
  evaluationId: string;
}

export function EvaluationResultsClient({
  evaluationId,
}: EvaluationResultsClientProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'en';
  const [evaluation, setEvaluation] = useState<EvaluationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 評価データの取得
  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const response = await fetch(`/api/evaluations/${evaluationId}`);
        const result = (await response.json()) as {
          success: boolean;
          data?: EvaluationWithDetails;
          error?: { message: string };
        };

        if (result.success === true && result.data) {
          setEvaluation(result.data);
        } else {
          setError(
            result.error?.message !== undefined && result.error.message !== ''
              ? result.error.message
              : '評価の取得に失敗しました',
          );
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [evaluationId]);

  // 評価レビュー（承認・差し戻し）
  const handleReview = async (approved: boolean, comments?: string) => {
    setActionLoading(true);

    try {
      const response = await fetch(`/api/evaluations/${evaluationId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved,
          comments,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: Partial<EvaluationWithDetails>;
        error?: { message: string };
      };

      if (result.success === true && result.data) {
        // 評価データを更新
        setEvaluation((prev) => (prev !== null ? { ...prev, ...result.data } : null));
      } else {
        setError(
          result.error?.message !== undefined && result.error.message !== ''
            ? result.error.message
            : 'レビューに失敗しました',
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // 評価共有
  const handleShare = async () => {
    setActionLoading(true);

    try {
      const response = await fetch(`/api/evaluations/${evaluationId}/review`, {
        method: 'PATCH',
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: Partial<EvaluationWithDetails>;
        error?: { message: string };
      };

      if (result.success === true && result.data) {
        // 評価データを更新
        setEvaluation((prev) => (prev !== null ? { ...prev, ...result.data } : null));
      } else {
        setError(
          result.error?.message !== undefined && result.error.message !== ''
            ? result.error.message
            : '共有に失敗しました',
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // ローディング状態
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">評価結果を読み込んでいます...</p>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error !== null || evaluation === null) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${currentLocale}/evaluations`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>戻る</span>
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error !== null ? error : '評価結果が見つかりません'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${currentLocale}/evaluations`)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>戻る</span>
        </Button>

        <h1 className="text-2xl font-bold">評価結果</h1>
      </div>

      {/* エラー表示 */}
      {error !== null && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 評価結果 */}
      <EvaluationResults
        evaluation={evaluation}
        onReview={handleReview}
        onShare={handleShare}
        isLoading={actionLoading}
      />
    </div>
  );
}
