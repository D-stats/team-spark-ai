/**
 * Unified Error Handling System
 * Provides consistent error handling throughout the application
 */

import { ApiError } from '@/types/api';

// ================
// Error Category Definitions
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
// Error Class Definitions
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
    userMessage?: string,
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

    // Preserve stack trace
    Error.captureStackTrace(this, AppError);
  }

  private getDefaultUserMessage(): string {
    // Return translation keys instead of hardcoded messages
    // These will be resolved by the client using the translation system
    switch (this.category) {
      case ErrorCategory.VALIDATION:
        return 'errors.validation.default';
      case ErrorCategory.AUTHENTICATION:
        return 'errors.authentication.default';
      case ErrorCategory.AUTHORIZATION:
        return 'errors.authorization.default';
      case ErrorCategory.NOT_FOUND:
        return 'errors.notFound.default';
      case ErrorCategory.CONFLICT:
        return 'errors.conflict.default';
      case ErrorCategory.RATE_LIMIT:
        return 'errors.rateLimit.default';
      case ErrorCategory.EXTERNAL_SERVICE:
        return 'errors.externalService.default';
      case ErrorCategory.DATABASE:
        return 'errors.database.default';
      case ErrorCategory.NETWORK:
        return 'errors.network.default';
      default:
        return 'errors.unknown.default';
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
// Predefined Errors
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
      field ? `${field}: ${message}` : message,
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(
      message,
      'AUTHENTICATION_ERROR',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      401,
      true,
      undefined,
      'errors.authentication.default',
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(action: string, resource?: string) {
    const message = resource
      ? `You do not have ${action} permission for ${resource}`
      : `You do not have ${action} permission`;

    super(
      message,
      'AUTHORIZATION_ERROR',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      403,
      true,
      { action, resource },
      'errors.authorization.default',
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} (ID: ${id}) not found` : `${resource} not found`;

    super(
      message,
      'NOT_FOUND_ERROR',
      ErrorCategory.NOT_FOUND,
      ErrorSeverity.LOW,
      404,
      true,
      { resource, id },
      'errors.notFound.default',
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
      'errors.conflict.default',
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
      'errors.database.default',
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
      'errors.externalService.default',
    );
  }
}

// ================
// Error Handler
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
        if (process.env.NODE_ENV === 'development') {
          console.info('LOW ERROR:', logData);
        }
        break;
    }
  }

  static handle(error: unknown): AppError {
    // If already AppError, return as is
    if (error instanceof AppError) {
      this.logError(error);
      return error;
    }

    // Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as {
        code: string;
        message: string;
        meta?: Record<string, unknown>;
      };
      return this.handlePrismaError(prismaError);
    }

    // Zod error
    if (error && typeof error === 'object' && 'issues' in error) {
      return this.handleZodError(error as { issues: Array<{ path: string[]; message: string }> });
    }

    // Standard Error object
    if (error instanceof Error) {
      const appError = new AppError(
        error.message,
        'UNKNOWN_ERROR',
        ErrorCategory.UNKNOWN,
        ErrorSeverity.MEDIUM,
        500,
        false,
      );
      this.logError(appError);
      return appError;
    }

    // Other unknown errors
    const appError = new AppError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      ErrorCategory.UNKNOWN,
      ErrorSeverity.MEDIUM,
      500,
      false,
      { originalError: error },
    );
    this.logError(appError);
    return appError;
  }

  private static handlePrismaError(error: {
    code: string;
    message: string;
    meta?: Record<string, unknown>;
  }): AppError {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return new ConflictError('Data already exists', {
          prismaCode: error.code,
          meta: error.meta,
        });
      case 'P2025': // Record not found
        return new NotFoundError('Data', undefined);
      case 'P2003': // Foreign key constraint violation
        return new ValidationError('Related data does not exist', undefined, {
          prismaCode: error.code,
        });
      case 'P2016': // Query interpretation error
        return new ValidationError('Invalid query', undefined, { prismaCode: error.code });
      default:
        return new DatabaseError(error.message, 'prisma', { code: error.code, meta: error.meta });
    }
  }

  private static handleZodError(error: {
    issues: Array<{ path: string[]; message: string }>;
  }): AppError {
    const firstIssue = error.issues[0];
    const field = firstIssue.path.join('.');
    return new ValidationError(firstIssue.message, field, { allIssues: error.issues });
  }
}

// ================
// Utility Functions
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
  return 'errors.unknown.default';
}

export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

// API Response Helpers
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
