# Monitoring and Logging Guide

## Overview

TeamSpark AI implements comprehensive monitoring and logging using:

- **Winston** for structured logging
- **OpenTelemetry** for distributed tracing and metrics
- Custom performance monitoring utilities

## Logging

### Log Levels

1. **error** - Critical errors that need immediate attention
2. **warn** - Warning conditions that might lead to errors
3. **info** - General informational messages
4. **http** - HTTP request/response logs
5. **debug** - Detailed debugging information

### Using the Logger

```typescript
import { log, logError, logApiRequest, logSecurityEvent, logBusinessEvent } from '@/lib/logger';

// Basic logging
log.info('User logged in', { userId: '123', email: 'user@example.com' });
log.warn('Rate limit approaching', { ip: '192.168.1.1', remaining: 5 });
log.error('Payment failed', { orderId: '456', error: 'Insufficient funds' });

// Structured error logging
try {
  await riskyOperation();
} catch (error) {
  logError(error as Error, 'RiskyOperation', {
    userId: '123',
    additionalContext: 'value',
  });
}

// API request logging
logApiRequest('POST', '/api/users', 201, 145, 'user-123');

// Security event logging
logSecurityEvent('suspicious_login', 'high', {
  ip: '192.168.1.1',
  attempts: 5,
  userId: 'user-123',
});

// Business event logging
logBusinessEvent('kudos_sent', 'user-123', {
  recipientId: 'user-456',
  points: 10,
  category: 'teamwork',
});
```

### Log Output

- **Development**: Colorized console output
- **Production**: JSON formatted files
  - `logs/error.log` - Error level logs only
  - `logs/combined.log` - All logs

### Log Format

```json
{
  "timestamp": "2025-06-19 15:30:45:123",
  "level": "info",
  "message": "User logged in",
  "userId": "123",
  "email": "user@example.com",
  "traceId": "abc123",
  "spanId": "def456"
}
```

## Distributed Tracing

### OpenTelemetry Setup

The application automatically instruments:

- HTTP requests
- Database queries
- External API calls
- Custom operations

### Creating Custom Spans

```typescript
import { createSpan, addSpanAttributes } from '@/lib/monitoring';

// Wrap async operations in spans
const result = await createSpan('process_payment', async () => {
  addSpanAttributes({
    'payment.amount': 100,
    'payment.currency': 'USD',
    'user.id': userId,
  });

  // Your async operation
  return await processPayment();
});
```

### Trace Context

Traces are automatically propagated across:

- API calls
- Background jobs
- Database queries
- External services

## Metrics

### Available Metrics

#### Counters

- `api_requests_total` - Total API requests by method, route, and status
- `errors_total` - Total errors by route and type
- `kudos_total` - Total kudos given
- `logins_total` - Total login attempts

#### Histograms

- `request_duration_ms` - API request duration
- `db_query_duration_ms` - Database query duration

#### Gauges

- `active_users` - Current active users
- `db_connections` - Active database connections

### Recording Custom Metrics

```typescript
import { apiRequestCounter, errorCounter, requestDurationHistogram } from '@/lib/monitoring';

// Increment counter
apiRequestCounter.add(1, {
  method: 'POST',
  route: '/api/kudos',
  status: '200',
});

// Record histogram value
requestDurationHistogram.record(150, {
  method: 'GET',
  route: '/api/users',
});
```

## Performance Monitoring

### Using PerformanceMonitor

```typescript
import { PerformanceMonitor } from '@/lib/monitoring';

async function expensiveOperation() {
  const monitor = new PerformanceMonitor('expensive_operation');

  try {
    // Your expensive operation
    await doSomethingExpensive();

    // End monitoring and record duration
    const duration = monitor.end({ status: 'success' });
    console.log(`Operation took ${duration}ms`);
  } catch (error) {
    monitor.end({ status: 'error', errorType: error.name });
    throw error;
  }
}
```

## API Route Monitoring

### Automatic Logging

All API routes wrapped with `withLogging` automatically log:

- Request method and path
- Response status code
- Request duration
- User ID (if authenticated)
- Request ID for correlation
- Client IP address

### Example

```typescript
import { withLogging } from '@/lib/api-logging';
import { withMiddleware, withAuth, withRateLimit } from '@/lib/api-helpers';

async function handler(request: NextRequest) {
  // Your API logic
}

export const GET = withMiddleware(
  handler,
  withLogging, // Adds logging
  withAuth, // Adds authentication
  withRateLimit, // Adds rate limiting
);
```

## Environment Configuration

### Development

```env
# Logging
LOG_LEVEL=debug

# OpenTelemetry (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

### Production

```env
# Logging
LOG_LEVEL=info

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com/v1/traces
OTEL_SERVICE_NAME=team-spark-ai
OTEL_SERVICE_VERSION=1.0.0
```

## Monitoring Dashboard

### Recommended Stack

1. **OpenTelemetry Collector** - Receive and process telemetry data
2. **Jaeger** or **Tempo** - Distributed tracing backend
3. **Prometheus** - Metrics storage
4. **Grafana** - Visualization and alerting
5. **Loki** - Log aggregation

### Key Dashboards

1. **API Performance**

   - Request rate by endpoint
   - Response time percentiles
   - Error rate
   - Rate limit violations

2. **Business Metrics**

   - Active users
   - Kudos sent per day
   - Login success rate
   - Feature adoption

3. **System Health**
   - Database connection pool
   - Memory usage
   - CPU utilization
   - Response times

## Alerting

### Recommended Alerts

1. **High Error Rate**

   - Threshold: > 5% of requests failing
   - Window: 5 minutes

2. **Slow Response Time**

   - Threshold: p95 > 1 second
   - Window: 5 minutes

3. **Database Connection Failures**

   - Threshold: Any connection failure
   - Window: 1 minute

4. **Security Events**
   - High severity events
   - Multiple failed login attempts
   - Rate limit violations from single IP

## Best Practices

### Logging

1. **Don't log sensitive data**

   - Passwords, tokens, credit cards are automatically redacted
   - Review logs before adding new fields

2. **Use structured logging**

   - Always use objects for metadata
   - Keep messages consistent

3. **Log at appropriate levels**
   - ERROR: Requires immediate attention
   - WARN: Should be investigated
   - INFO: Business events and state changes
   - DEBUG: Development only

### Performance

1. **Batch operations**

   - Group similar operations to reduce overhead
   - Use bulk database queries

2. **Async logging**

   - Logs are written asynchronously
   - Don't block on log operations

3. **Sample high-volume traces**
   - Configure sampling for high-traffic endpoints
   - Keep 100% of error traces

### Security

1. **Sanitize logs**

   - Use `sanitizeInput()` for user data
   - Review logs for PII

2. **Monitor security events**

   - Track authentication failures
   - Monitor for suspicious patterns

3. **Secure log storage**
   - Encrypt logs at rest
   - Limit access to production logs

## Troubleshooting

### Common Issues

1. **Missing traces**

   - Check OTEL_EXPORTER_OTLP_ENDPOINT
   - Verify collector is running
   - Check network connectivity

2. **High log volume**

   - Increase LOG_LEVEL to 'info'
   - Implement log sampling
   - Review debug logs

3. **Performance impact**
   - Disable instrumentation for specific routes
   - Increase batching intervals
   - Use sampling

### Debug Commands

```bash
# Check if monitoring is initialized
grep "OpenTelemetry monitoring initialized" logs/combined.log

# View recent errors
tail -f logs/error.log | jq '.'

# Check trace export
curl http://localhost:4318/v1/traces

# Monitor metrics endpoint
curl http://localhost:9090/metrics
```
