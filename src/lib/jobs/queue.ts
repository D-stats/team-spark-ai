import { Queue, QueueEvents } from 'bullmq';
import { getRedisClient } from '@/lib/redis';
import { log } from '@/lib/logger';

// Define job types
export enum JobType {
  SEND_EMAIL = 'send-email',
  SYNC_SLACK = 'sync-slack',
  GENERATE_REPORT = 'generate-report',
  CLEANUP_OLD_DATA = 'cleanup-old-data',
  SEND_KUDOS_NOTIFICATION = 'send-kudos-notification',
  PROCESS_CHECKIN = 'process-checkin',
  CALCULATE_METRICS = 'calculate-metrics',
}

// Job data interfaces
export interface SendEmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export interface SyncSlackJobData {
  workspaceId: string;
  syncType: 'users' | 'channels' | 'messages';
}

export interface GenerateReportJobData {
  organizationId: string;
  reportType: 'weekly' | 'monthly' | 'quarterly';
  recipientIds: string[];
}

export interface CleanupJobData {
  daysToKeep: number;
  dataType: 'logs' | 'sessions' | 'temp-files';
}

export interface KudosNotificationJobData {
  kudosId: string;
  senderId: string;
  receiverId: string;
  message: string;
}

export interface ProcessCheckinJobData {
  checkinId: string;
  userId: string;
  templateId: string;
}

export interface CalculateMetricsJobData {
  organizationId: string;
  metricType: 'engagement' | 'performance' | 'satisfaction';
  period: 'daily' | 'weekly' | 'monthly';
}

// Queue configuration
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600, // Keep completed jobs for 1 hour
    count: 100, // Keep max 100 completed jobs
  },
  removeOnFail: {
    age: 24 * 3600, // Keep failed jobs for 24 hours
  },
};

// Create queues
export const emailQueue = new Queue<SendEmailJobData>(JobType.SEND_EMAIL, {
  connection: getRedisClient(),
  defaultJobOptions,
});

export const slackQueue = new Queue<SyncSlackJobData>(JobType.SYNC_SLACK, {
  connection: getRedisClient(),
  defaultJobOptions,
});

export const reportQueue = new Queue<GenerateReportJobData>(JobType.GENERATE_REPORT, {
  connection: getRedisClient(),
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2,
  },
});

export const maintenanceQueue = new Queue<CleanupJobData>(JobType.CLEANUP_OLD_DATA, {
  connection: getRedisClient(),
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 1,
  },
});

export const notificationQueue = new Queue<KudosNotificationJobData>(
  JobType.SEND_KUDOS_NOTIFICATION,
  {
    connection: getRedisClient(),
    defaultJobOptions: {
      ...defaultJobOptions,
      attempts: 5,
    },
  },
);

export const checkinQueue = new Queue<ProcessCheckinJobData>(JobType.PROCESS_CHECKIN, {
  connection: getRedisClient(),
  defaultJobOptions,
});

export const metricsQueue = new Queue<CalculateMetricsJobData>(JobType.CALCULATE_METRICS, {
  connection: getRedisClient(),
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2,
  },
});

// Queue event monitoring
export function setupQueueMonitoring(queue: Queue) {
  const queueEvents = new QueueEvents(queue.name, {
    connection: getRedisClient(),
  });

  queueEvents.on('completed', ({ jobId, returnvalue }) => {
    log.info(`Job completed`, {
      queue: queue.name,
      jobId,
      result: returnvalue,
    });
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    log.error(`Job failed`, {
      queue: queue.name,
      jobId,
      reason: failedReason,
    });
  });

  queueEvents.on('progress', ({ jobId, data }) => {
    log.debug(`Job progress`, {
      queue: queue.name,
      jobId,
      progress: data,
    });
  });

  queueEvents.on('stalled', ({ jobId }) => {
    log.warn(`Job stalled`, {
      queue: queue.name,
      jobId,
    });
  });

  return queueEvents;
}

// Helper functions
export async function addJob<T>(
  queue: Queue<T>,
  name: string,
  data: T,
  options?: {
    delay?: number;
    priority?: number;
    repeat?: {
      pattern?: string;
      every?: number;
      limit?: number;
    };
  },
) {
  try {
    const job = await (queue as any).add(name, data, options);
    log.info(`Job added to queue`, {
      queue: queue.name,
      jobId: job.id,
      name,
    });
    return job;
  } catch (error) {
    log.error(`Failed to add job to queue`, {
      queue: queue.name,
      name,
      error: (error as Error).message,
    });
    throw error;
  }
}

export async function getQueueMetrics(queue: Queue) {
  const counts = await queue.getJobCounts();
  const waiting = counts['waiting'] || 0;
  const active = counts['active'] || 0;
  const completed = counts['completed'] || 0;
  const failed = counts['failed'] || 0;
  const delayed = counts['delayed'] || 0;
  const paused = counts['paused'] || 0;

  return {
    name: queue.name,
    counts: {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    },
    total: waiting + active + completed + failed + delayed + paused,
  };
}

export async function getAllQueueMetrics() {
  const queues = [
    emailQueue,
    slackQueue,
    reportQueue,
    maintenanceQueue,
    notificationQueue,
    checkinQueue,
    metricsQueue,
  ];

  const metrics = await Promise.all(queues.map(getQueueMetrics));
  return metrics;
}

// Graceful shutdown
export async function closeQueues() {
  const queues = [
    emailQueue,
    slackQueue,
    reportQueue,
    maintenanceQueue,
    notificationQueue,
    checkinQueue,
    metricsQueue,
  ];

  await Promise.all(queues.map((queue) => queue.close()));
  log.info('All queues closed');
}
