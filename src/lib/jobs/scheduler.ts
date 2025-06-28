import { emailQueue, metricsQueue, maintenanceQueue, reportQueue, addJob, JobType } from './queue';
import { Queue } from 'bullmq';
import { getRedisClient } from '@/lib/redis';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

interface ScheduledJob<T = unknown> {
  name: string;
  queue: Queue<T>;
  pattern?: string;
  every?: number;
  data: T | (() => Promise<T | T[]>);
  options?: {
    delay?: number;
    priority?: number;
  };
}

// Define scheduled jobs
const scheduledJobs: ScheduledJob[] = [
  // Daily engagement metrics
  {
    name: 'daily-engagement-metrics',
    queue: metricsQueue,
    pattern: '0 1 * * *', // Every day at 1 AM
    data: async () => {
      const organizations = await prisma.organization.findMany({
        select: { id: true },
      });

      return organizations.map((org) => ({
        organizationId: org.id,
        metricType: 'engagement',
        period: 'daily',
      }));
    },
  },

  // Weekly performance metrics
  {
    name: 'weekly-performance-metrics',
    queue: metricsQueue,
    pattern: '0 2 * * 1', // Every Monday at 2 AM
    data: async () => {
      const organizations = await prisma.organization.findMany({
        select: { id: true },
      });

      return organizations.map((org) => ({
        organizationId: org.id,
        metricType: 'performance',
        period: 'weekly',
      }));
    },
  },

  // Monthly satisfaction metrics
  {
    name: 'monthly-satisfaction-metrics',
    queue: metricsQueue,
    pattern: '0 3 1 * *', // First day of month at 3 AM
    data: async () => {
      const organizations = await prisma.organization.findMany({
        select: { id: true },
      });

      return organizations.map((org) => ({
        organizationId: org.id,
        metricType: 'satisfaction',
        period: 'monthly',
      }));
    },
  },

  // Weekly team reports
  {
    name: 'weekly-team-reports',
    queue: reportQueue,
    pattern: '0 9 * * 1', // Every Monday at 9 AM
    data: async () => {
      const managers = await prisma.user.findMany({
        where: {
          role: { in: ['MANAGER', 'ADMIN'] },
          isActive: true,
        },
        select: {
          id: true,
          organizationId: true,
        },
      });

      // Group by organization
      const reportsByOrg = managers.reduce(
        (acc, manager) => {
          if (!acc[manager.organizationId]) {
            acc[manager.organizationId] = [];
          }
          const orgManagers = acc[manager.organizationId];
          if (orgManagers) {
            orgManagers.push(manager.id);
          }
          return acc;
        },
        {} as Record<string, string[]>,
      );

      return Object.entries(reportsByOrg).map(([orgId, recipientIds]) => ({
        organizationId: orgId,
        reportType: 'weekly',
        recipientIds,
      }));
    },
  },

  // Daily cleanup of old logs
  {
    name: 'daily-log-cleanup',
    queue: maintenanceQueue,
    pattern: '0 4 * * *', // Every day at 4 AM
    data: {
      daysToKeep: 7,
      dataType: 'logs',
    },
  },

  // Weekly cleanup of old sessions
  {
    name: 'weekly-session-cleanup',
    queue: maintenanceQueue,
    pattern: '0 5 * * 0', // Every Sunday at 5 AM
    data: {
      daysToKeep: 30,
      dataType: 'sessions',
    },
  },
];

// Schedule all jobs
export async function scheduleJobs(): Promise<void> {
  log.info('Scheduling recurring jobs...');

  for (const job of scheduledJobs) {
    try {
      // Get job data
      const jobData: unknown =
        job.data !== null && job.data !== undefined && typeof job.data === 'function'
          ? await job.data()
          : job.data;

      if (Array.isArray(jobData)) {
        // Schedule multiple jobs
        for (const data of jobData) {
          await addJob(job.queue, job.name, data, {
            repeat: {
              pattern: job.pattern,
              every: job.every,
            },
            ...job.options,
          });
        }
      } else {
        // Schedule single job
        await addJob(job.queue, job.name, jobData, {
          repeat: {
            pattern: job.pattern,
            every: job.every,
          },
          ...job.options,
        });
      }

      log.info(`Scheduled job: ${job.name}`, {
        pattern: job.pattern,
        every: job.every,
      });
    } catch (error) {
      log.error(`Failed to schedule job: ${job.name}`, {
        error: (error as Error).message,
      });
    }
  }

  log.info('Job scheduling completed');
}

// Remove all scheduled jobs
export async function unscheduleJobs(): Promise<void> {
  log.info('Removing scheduled jobs...');

  const queues = [emailQueue, metricsQueue, maintenanceQueue, reportQueue];

  for (const queue of queues) {
    try {
      const repeatableJobs = await queue.getRepeatableJobs();

      for (const job of repeatableJobs) {
        await queue.removeRepeatableByKey(job.key);
        log.info(`Removed scheduled job`, {
          queue: queue.name,
          jobName: job.name,
        });
      }
    } catch (error) {
      log.error(`Failed to remove scheduled jobs from queue: ${queue.name}`, {
        error: (error as Error).message,
      });
    }
  }

  log.info('Scheduled jobs removed');
}

// Schedule a one-time job
export async function scheduleOneTimeJob<T>(
  jobType: JobType,
  data: T,
  delay: number, // Delay in milliseconds
): Promise<Awaited<ReturnType<typeof addJob>>> {
  // Create missing queues if needed
  const redis = getRedisClient();
  const slackSyncQueue = new Queue('slack-sync', { connection: redis });
  const notificationQueue = new Queue('notification', { connection: redis });
  const userSyncQueue = new Queue('user-sync', { connection: redis });

  const queueMap: Record<JobType, Queue> = {
    [JobType.SEND_EMAIL]: emailQueue,
    [JobType.SYNC_SLACK]: slackSyncQueue,
    [JobType.CALCULATE_METRICS]: metricsQueue,
    [JobType.CLEANUP_OLD_DATA]: maintenanceQueue,
    [JobType.GENERATE_REPORT]: reportQueue,
    [JobType.SEND_KUDOS_NOTIFICATION]: notificationQueue,
    [JobType.PROCESS_CHECKIN]: userSyncQueue,
  };

  const queue = queueMap[jobType];
  if (queue === null || queue === undefined) {
    throw new Error(`No queue found for job type: ${jobType}`);
  }

  return addJob(queue, `one-time-${jobType}`, data, { delay });
}
