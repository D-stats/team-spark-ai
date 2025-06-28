import winston from 'winston';
import { trace } from '@opentelemetry/api';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Define which transports to use
const transports: winston.transport[] = [];

// Console transport
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf((info) => `${info['timestamp']} ${info.level}: ${info.message}`),
      ),
    }),
  );
}

// File transports
if (isProduction) {
  // Error log
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
  );

  // Combined log
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  );
}

// Create the logger
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Extend logger with OpenTelemetry context
export const log = {
  error: (message: string, meta?: Record<string, unknown>) => {
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();
    logger.error(message, {
      ...meta,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
    });
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();
    logger.warn(message, {
      ...meta,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
    });
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();
    logger.info(message, {
      ...meta,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
    });
  },
  http: (message: string, meta?: Record<string, unknown>) => {
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();
    logger.http(message, {
      ...meta,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
    });
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();
    logger.debug(message, {
      ...meta,
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
    });
  },
};

// Helper functions for structured logging
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
) {
  log.http('API Request', {
    method,
    path,
    statusCode,
    duration,
    userId,
    type: 'api_request',
  });
}

export function logError(error: Error, context: string, additionalData?: Record<string, unknown>) {
  log.error(`Error in ${context}: ${error.message}`, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    ...additionalData,
    type: 'error',
  });
}

export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high',
  details: Record<string, unknown>,
) {
  log.warn(`Security Event: ${event}`, {
    event,
    severity,
    ...details,
    type: 'security',
  });
}

export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>,
) {
  const level = duration > 1000 ? 'warn' : 'info';
  log[level](`Performance: ${operation}`, {
    operation,
    duration,
    ...metadata,
    type: 'performance',
  });
}

export function logBusinessEvent(event: string, userId: string, metadata?: Record<string, unknown>) {
  log.info(`Business Event: ${event}`, {
    event,
    userId,
    ...metadata,
    type: 'business',
  });
}

export default logger;
