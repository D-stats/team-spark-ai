import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { metrics, trace } from '@opentelemetry/api';

const isProduction = process.env.NODE_ENV === 'production';

// Initialize OpenTelemetry
export function initializeMonitoring() {
  if (!isProduction && !process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.log('Monitoring disabled in development (set OTEL_EXPORTER_OTLP_ENDPOINT to enable)');
    return;
  }

  const resource = resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: 'team-spark-ai',
    [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  });

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable fs instrumentation to reduce noise
        },
      }),
    ],
  });

  sdk.start();
  console.log('OpenTelemetry monitoring initialized');
}

// Custom metrics
const meter = metrics.getMeter('team-spark-ai');

// Counters
export const apiRequestCounter = meter.createCounter('api_requests_total', {
  description: 'Total number of API requests',
});

export const errorCounter = meter.createCounter('errors_total', {
  description: 'Total number of errors',
});

export const kudosCounter = meter.createCounter('kudos_total', {
  description: 'Total number of kudos given',
});

export const loginCounter = meter.createCounter('logins_total', {
  description: 'Total number of logins',
});

// Histograms
export const requestDurationHistogram = meter.createHistogram('request_duration_ms', {
  description: 'Request duration in milliseconds',
});

export const dbQueryDurationHistogram = meter.createHistogram('db_query_duration_ms', {
  description: 'Database query duration in milliseconds',
});

// Gauges
export const activeUsersGauge = meter.createObservableGauge('active_users', {
  description: 'Number of active users',
});

export const dbConnectionsGauge = meter.createObservableGauge('db_connections', {
  description: 'Number of database connections',
});

// Helper functions for tracing
export function createSpan(name: string, fn: () => Promise<any>) {
  const tracer = trace.getTracer('team-spark-ai');
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export function addSpanAttributes(attributes: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
}

// Monitoring middleware for API routes
export function monitorApiRoute(routeName: string) {
  return async (request: Request) => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url);

    return createSpan(`${method} ${routeName}`, async () => {
      addSpanAttributes({
        'http.method': method,
        'http.url': url.pathname,
        'http.target': routeName,
      });

      try {
        // Process the request (this would be replaced with actual handler)
        const response = await Promise.resolve(new Response('OK'));

        const duration = Date.now() - startTime;
        const statusCode = response.status;

        // Record metrics
        apiRequestCounter.add(1, {
          method,
          route: routeName,
          status: statusCode.toString(),
        });

        requestDurationHistogram.record(duration, {
          method,
          route: routeName,
        });

        addSpanAttributes({
          'http.status_code': statusCode,
          'http.response_content_length': response.headers.get('content-length') || 0,
        });

        return response;
      } catch (error) {
        errorCounter.add(1, {
          route: routeName,
          type: (error as Error).name,
        });
        throw error;
      }
    });
  };
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = performance.now();
  }

  end(metadata?: Record<string, any>) {
    const duration = performance.now() - this.startTime;
    dbQueryDurationHistogram.record(duration, {
      operation: this.operation,
      ...metadata,
    });
    return duration;
  }
}
