/**
 * ユーザーフレンドリーエラー表示コンポーネント
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getErrorMessage, getErrorCode, isAppError } from '@/lib/errors';

interface ErrorDisplayProps {
  error: unknown;
  onRetry?: () => void;
  showHomeButton?: boolean;
  className?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  showHomeButton = false,
  className,
}: ErrorDisplayProps): JSX.Element {
  const router = useRouter();
  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);
  const isOperational = isAppError(error) ? error.isOperational : false;

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="space-y-4">
        <div>
          <p className="font-medium">{errorMessage}</p>
          {!isOperational && (
            <p className="mt-1 text-sm opacity-80">
              予期しないエラーが発生しました。問題が続く場合は管理者にお問い合わせください。
            </p>
          )}
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-2 font-mono text-xs opacity-60">エラーコード: {errorCode}</p>
          )}
        </div>

        <div className="flex space-x-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-3 w-3" />
              <span>再試行</span>
            </Button>
          )}

          {showHomeButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoHome}
              className="flex items-center space-x-2"
            >
              <Home className="h-3 w-3" />
              <span>ホームに戻る</span>
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
