/**
 * 統一エラーハンドリングシステム
 * アプリケーション全体で一貫したエラー処理を提供
 */

import { ApiError } from '@/types/api';

// ================
// エラー分類定義
// ================

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ================
// エラークラス定義
// ================

export class AppError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly userMessage: string;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>,
    userMessage?: string
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.userMessage = userMessage || this.getDefaultUserMessage();

    // スタックトレースを保持
    Error.captureStackTrace(this, AppError);
  }

  private getDefaultUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.VALIDATION:
        return '入力内容に不備があります。正しい値を入力してください。';
      case ErrorCategory.AUTHENTICATION:
        return 'ログインが必要です。再度ログインしてください。';
      case ErrorCategory.AUTHORIZATION:
        return 'この操作を実行する権限がありません。';
      case ErrorCategory.NOT_FOUND:
        return '指定されたリソースが見つかりません。';
      case ErrorCategory.CONFLICT:
        return '操作が競合しました。ページを更新して再試行してください。';
      case ErrorCategory.RATE_LIMIT:
        return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
      case ErrorCategory.EXTERNAL_SERVICE:
        return '外部サービスとの通信でエラーが発生しました。';
      case ErrorCategory.DATABASE:
        return 'データベースエラーが発生しました。';
      case ErrorCategory.NETWORK:
        return 'ネットワークエラーが発生しました。接続を確認してください。';
      default:
        return 'システムエラーが発生しました。しばらく待ってから再試行してください。';
    }
  }

  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.userMessage,
      details: this.context,
    };
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      context: this.context,
      stack: this.stack,
    };
  }
}

// ================
// 事前定義エラー
// ================

export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: Record<string, unknown>) {
    super(
      message,
      'VALIDATION_ERROR',
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      400,
      true,
      { field, ...context },
      field ? `${field}: ${message}` : message
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(
      message,
      'AUTHENTICATION_ERROR',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      401,
      true,
      undefined,
      'ログインが必要です。再度ログインしてください。'
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(action: string, resource?: string) {
    const message = resource 
      ? `${resource}に対する${action}権限がありません`
      : `${action}権限がありません`;
    
    super(
      message,
      'AUTHORIZATION_ERROR',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      403,
      true,
      { action, resource },
      'この操作を実行する権限がありません。'
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} (ID: ${id}) が見つかりません` : `${resource}が見つかりません`;
    
    super(
      message,
      'NOT_FOUND_ERROR',
      ErrorCategory.NOT_FOUND,
      ErrorSeverity.LOW,
      404,
      true,
      { resource, id },
      '指定されたリソースが見つかりません。'
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      'CONFLICT_ERROR',
      ErrorCategory.CONFLICT,
      ErrorSeverity.MEDIUM,
      409,
      true,
      context,
      '操作が競合しました。ページを更新して再試行してください。'
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, operation?: string, context?: Record<string, unknown>) {
    super(
      message,
      'DATABASE_ERROR',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      500,
      true,
      { operation, ...context },
      'データベースエラーが発生しました。しばらく待ってから再試行してください。'
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, unknown>) {
    super(
      message,
      'EXTERNAL_SERVICE_ERROR',
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.MEDIUM,
      503,
      true,
      { service, ...context },
      '外部サービスとの通信でエラーが発生しました。しばらく待ってから再試行してください。'
    );
  }
}

// ================
// エラーハンドラー
// ================

export class ErrorHandler {
  private static logError(error: AppError): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error: error.toJSON(),
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('CRITICAL ERROR:', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('HIGH ERROR:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('MEDIUM ERROR:', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('LOW ERROR:', logData);
        break;
    }
  }

  static handle(error: unknown): AppError {
    // 既にAppErrorの場合はそのまま返す
    if (error instanceof AppError) {
      this.logError(error);
      return error;
    }

    // Prismaエラー
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string; meta?: Record<string, unknown> };
      return this.handlePrismaError(prismaError);
    }

    // Zodエラー
    if (error && typeof error === 'object' && 'issues' in error) {
      return this.handleZodError(error as { issues: Array<{ path: string[]; message: string }> });
    }

    // 標準Errorオブジェクト
    if (error instanceof Error) {
      const appError = new AppError(
        error.message,
        'UNKNOWN_ERROR',
        ErrorCategory.UNKNOWN,
        ErrorSeverity.MEDIUM,
        500,
        false
      );
      this.logError(appError);
      return appError;
    }

    // その他の未知のエラー
    const appError = new AppError(
      '予期しないエラーが発生しました',
      'UNKNOWN_ERROR',
      ErrorCategory.UNKNOWN,
      ErrorSeverity.MEDIUM,
      500,
      false,
      { originalError: error }
    );
    this.logError(appError);
    return appError;
  }

  private static handlePrismaError(error: { code: string; message: string; meta?: Record<string, unknown> }): AppError {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return new ConflictError('データが既に存在します', { prismaCode: error.code, meta: error.meta });
      case 'P2025': // Record not found
        return new NotFoundError('データ', undefined);
      case 'P2003': // Foreign key constraint violation
        return new ValidationError('関連するデータが存在しません', undefined, { prismaCode: error.code });
      case 'P2016': // Query interpretation error
        return new ValidationError('クエリが無効です', undefined, { prismaCode: error.code });
      default:
        return new DatabaseError(error.message, 'prisma', { code: error.code, meta: error.meta });
    }
  }

  private static handleZodError(error: { issues: Array<{ path: string[]; message: string }> }): AppError {
    const firstIssue = error.issues[0];
    const field = firstIssue.path.join('.');
    return new ValidationError(firstIssue.message, field, { allIssues: error.issues });
  }
}

// ================
// ユーティリティ関数
// ================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'システムエラーが発生しました';
}

export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

// APIレスポンス用ヘルパー
export function createErrorResponse(error: unknown, statusCode?: number) {
  const appError = ErrorHandler.handle(error);
  
  return {
    success: false,
    error: appError.toApiError(),
    statusCode: statusCode || appError.statusCode,
  };
}

export function createSuccessResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true,
    data,
    meta,
  };
}