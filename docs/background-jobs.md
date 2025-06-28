# Background Jobs Documentation

## Overview

TeamSpark AI uses BullMQ for background job processing, providing:

- Reliable job execution with retries
- Job scheduling and recurring tasks
- Priority queues
- Progress tracking
- Distributed processing

## Architecture

### Queues

1. **Email Queue** (`send-email`)

   - Transactional emails
   - Notifications
   - Reports

2. **Slack Queue** (`sync-slack`)

   - User synchronization
   - Channel management
   - Message processing

3. **Report Queue** (`generate-report`)

   - Weekly team reports
   - Monthly summaries
   - Custom reports

4. **Maintenance Queue** (`cleanup-old-data`)

   - Log cleanup
   - Session cleanup
   - Temporary file removal

5. **Notification Queue** (`send-kudos-notification`)

   - Kudos notifications
   - Achievement alerts
   - Team updates

6. **Check-in Queue** (`process-checkin`)

   - Process check-in responses
   - Calculate mood trends
   - Generate insights

7. **Metrics Queue** (`calculate-metrics`)
   - Engagement metrics
   - Performance metrics
   - Satisfaction metrics

### Workers

Workers process jobs from their respective queues:

```typescript
// Email worker with rate limiting
const emailWorker = new Worker(
  JobType.SEND_EMAIL,
  async (job) => {
    // Process email job
  },
  {
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // 10 emails per second
    },
  },
);
```

## Running Workers

### Development

```bash
# Run worker in development with auto-reload
npm run worker:dev

# Run worker without auto-reload
npm run worker
```

### Production

```bash
# Using PM2
pm2 start npm --name "worker" -- run worker

# Using Docker
docker-compose up -d worker

# Using systemd
sudo systemctl start teamspark-worker
```

### Multiple Workers

For scaling, run multiple worker instances:

```bash
# Start 3 worker instances
pm2 start npm --name "worker" -i 3 -- run worker
```

## Job Management

### Adding Jobs

```typescript
import { addJob, emailQueue } from '@/lib/jobs/queue';

// Add email job
const job = await addJob(emailQueue, 'welcome-email', {
  to: 'user@example.com',
  subject: 'Welcome to TeamSpark!',
  template: 'welcome',
  data: { name: 'John' },
});

// Add delayed job
await addJob(emailQueue, 'reminder', data, {
  delay: 60000, // 1 minute delay
});

// Add priority job
await addJob(emailQueue, 'urgent', data, {
  priority: 1, // Higher priority
});
```

### Scheduled Jobs

Recurring jobs are defined in the scheduler:

```typescript
// Daily engagement metrics at 1 AM
{
  name: 'daily-engagement-metrics',
  queue: metricsQueue,
  pattern: '0 1 * * *',
  data: { /* job data */ },
}

// Weekly reports on Monday at 9 AM
{
  name: 'weekly-team-reports',
  queue: reportQueue,
  pattern: '0 9 * * 1',
  data: { /* job data */ },
}
```

### Job Monitoring

#### Via API

```bash
# Get job metrics
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/jobs

# Response
{
  "metrics": [
    {
      "name": "send-email",
      "counts": {
        "waiting": 5,
        "active": 2,
        "completed": 150,
        "failed": 3,
        "delayed": 0,
        "paused": 0
      }
    }
  ]
}
```

#### Via Logs

Workers log job progress:

```
2025-06-19 10:30:45 info: Job added to queue queue=send-email jobId=123
2025-06-19 10:30:46 info: Processing email job jobId=123 to=user@example.com
2025-06-19 10:30:47 info: Email sent successfully jobId=123
```

### Job Cleanup

```bash
# Clean old completed and failed jobs
npm run jobs:clean

# Output
🧹 Cleaning job queues...
✅ Cleaned 150 completed jobs from send-email
❌ Cleaned 3 failed jobs from send-email
📊 send-email: waiting=0, active=0, completed=0, failed=0
```

## Job Types

### Email Jobs

```typescript
interface SendEmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Example
await addJob(emailQueue, 'team-update', {
  to: 'team@example.com',
  subject: 'Weekly Team Update',
  template: 'team-update',
  data: {
    kudosCount: 25,
    topPerformers: ['Alice', 'Bob'],
  },
});
```

### Slack Sync Jobs

```typescript
interface SyncSlackJobData {
  workspaceId: string;
  syncType: 'users' | 'channels' | 'messages';
}

// Example
await addJob(slackQueue, 'sync-users', {
  workspaceId: 'workspace-123',
  syncType: 'users',
});
```

### Report Generation

```typescript
interface GenerateReportJobData {
  organizationId: string;
  reportType: 'weekly' | 'monthly' | 'quarterly';
  recipientIds: string[];
}

// Example
await addJob(reportQueue, 'monthly-report', {
  organizationId: 'org-123',
  reportType: 'monthly',
  recipientIds: ['user-1', 'user-2'],
});
```

### Metrics Calculation

```typescript
interface CalculateMetricsJobData {
  organizationId: string;
  metricType: 'engagement' | 'performance' | 'satisfaction';
  period: 'daily' | 'weekly' | 'monthly';
}

// Example
await addJob(metricsQueue, 'engagement-metrics', {
  organizationId: 'org-123',
  metricType: 'engagement',
  period: 'weekly',
});
```

## Error Handling

### Retry Configuration

Jobs are retried with exponential backoff:

```typescript
defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2 second delay
  },
};
```

### Failed Job Handling

Failed jobs are kept for 24 hours for debugging:

```typescript
removeOnFail: {
  age: 24 * 3600, // 24 hours
}
```

### Error Recovery

Workers handle errors gracefully:

```typescript
try {
  // Process job
} catch (error) {
  log.error('Job failed', { error });
  // Job will be retried based on configuration
  throw error;
}
```

## Best Practices

### 1. Idempotent Jobs

Make jobs idempotent to handle retries:

```typescript
// Good: Check if email was already sent
const existingEmail = await findEmailByJobId(job.id);
if (existingEmail) {
  return { alreadySent: true };
}

// Send email...
```

### 2. Progress Tracking

Update job progress for long-running tasks:

```typescript
await job.updateProgress(10);
// Process part 1...

await job.updateProgress(50);
// Process part 2...

await job.updateProgress(100);
// Complete
```

### 3. Graceful Shutdown

Workers handle shutdown signals:

```typescript
process.on('SIGTERM', async () => {
  await stopWorkers();
  process.exit(0);
});
```

### 4. Resource Limits

Set appropriate concurrency limits:

```typescript
new Worker(queue, processor, {
  concurrency: 5, // Process max 5 jobs simultaneously
});
```

### 5. Monitoring

Monitor queue health:

- Job completion rate
- Average processing time
- Failed job rate
- Queue depth

## Deployment

### Environment Variables

```env
# Redis connection for job queues
REDIS_URL=redis://localhost:6379

# Worker configuration
WORKER_CONCURRENCY=5
JOB_RETENTION_HOURS=24
```

### Docker

```dockerfile
# Worker service in docker-compose.yml
worker:
  build: .
  command: npm run worker
  environment:
    - NODE_ENV=production
    - REDIS_URL=redis://redis:6379
  depends_on:
    - redis
    - postgres
  restart: unless-stopped
```

### Scaling

1. **Vertical Scaling**: Increase worker concurrency
2. **Horizontal Scaling**: Run multiple worker instances
3. **Queue Prioritization**: Use priority queues for important jobs

## Troubleshooting

### Common Issues

1. **Jobs not processing**

   - Check Redis connection
   - Verify worker is running
   - Check for errors in logs

2. **High memory usage**

   - Reduce concurrency
   - Clean old jobs regularly
   - Check for memory leaks

3. **Slow processing**
   - Add more workers
   - Optimize job processing logic
   - Check external service latency

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor Redis commands
redis-cli monitor

# Check worker logs
pm2 logs worker

# View queue stats in Redis
redis-cli
> KEYS bull:*
> LLEN bull:send-email:wait
```

## Security

1. **Job Data**: Don't store sensitive data in job payload
2. **Authentication**: Validate permissions before adding jobs
3. **Rate Limiting**: Implement rate limits for job creation
4. **Monitoring**: Alert on suspicious job patterns
