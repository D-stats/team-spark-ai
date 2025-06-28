import { Worker, Job } from 'bullmq';
import { getRedisClient } from '@/lib/redis';
import { log } from '@/lib/logger';
import { CalculateMetricsJobData, JobType } from '../queue';
import { prisma } from '@/lib/prisma';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

export const metricsWorker = new Worker<CalculateMetricsJobData>(
  JobType.CALCULATE_METRICS,
  async (job: Job<CalculateMetricsJobData>) => {
    const { organizationId, metricType, period } = job.data;

    log.info('Processing metrics calculation job', {
      jobId: job.id,
      organizationId,
      metricType,
      period,
    });

    try {
      const dateRange = getDateRange(period);

      switch (metricType) {
        case 'engagement':
          return await calculateEngagementMetrics(organizationId, dateRange, job);
        case 'performance':
          return await calculatePerformanceMetrics(organizationId, dateRange, job);
        case 'satisfaction':
          return await calculateSatisfactionMetrics(organizationId, dateRange, job);
        default:
          throw new Error(`Unknown metric type: ${metricType}`);
      }
    } catch (error) {
      log.error('Failed to calculate metrics', {
        jobId: job.id,
        organizationId,
        error: (error as Error).message,
      });
      throw error;
    }
  },
  {
    connection: getRedisClient(),
    concurrency: 3,
  },
);

function getDateRange(period: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } {
  const now = new Date();

  switch (period) {
    case 'daily':
      return {
        start: startOfDay(subDays(now, 1)),
        end: endOfDay(subDays(now, 1)),
      };
    case 'weekly':
      return {
        start: startOfWeek(subDays(now, 7)),
        end: endOfWeek(subDays(now, 7)),
      };
    case 'monthly':
      return {
        start: startOfMonth(subDays(now, 30)),
        end: endOfMonth(subDays(now, 30)),
      };
  }
}

interface EngagementMetrics {
  kudosCount: number;
  uniqueKudosGivers: number;
  checkInsCount: number;
  activeUsers: number;
  totalUsers: number;
  engagementRate: number;
  kudosPerUser: number;
}

interface MetricsResult<T> {
  success: boolean;
  metrics: T;
  period: {
    start: string;
    end: string;
  };
}

async function calculateEngagementMetrics(
  organizationId: string,
  dateRange: { start: Date; end: Date },
  job: Job,
): Promise<MetricsResult<EngagementMetrics>> {
  await job.updateProgress(10);

  // Calculate kudos metrics
  const kudosCount = await prisma.kudos.count({
    where: {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
      sender: {
        organizationId,
      },
    },
  });

  await job.updateProgress(30);

  // Calculate unique kudos givers
  const uniqueGivers = await prisma.kudos.findMany({
    where: {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
      sender: {
        organizationId,
      },
    },
    select: {
      senderId: true,
    },
    distinct: ['senderId'],
  });

  await job.updateProgress(50);

  // Calculate check-in participation
  const checkInsCount = await prisma.checkIn.count({
    where: {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
      user: {
        organizationId,
      },
    },
  });

  await job.updateProgress(70);

  // Calculate active users
  const activeUsers = await prisma.user.count({
    where: {
      organizationId,
      lastActiveAt: {
        gte: dateRange.start,
      },
    },
  });

  await job.updateProgress(90);

  const totalUsers = await prisma.user.count({
    where: {
      organizationId,
      isActive: true,
    },
  });

  await job.updateProgress(100);

  const metrics = {
    kudosCount,
    uniqueKudosGivers: uniqueGivers.length,
    checkInsCount,
    activeUsers,
    totalUsers,
    engagementRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
    kudosPerUser: totalUsers > 0 ? kudosCount / totalUsers : 0,
  };

  log.info('Engagement metrics calculated', {
    organizationId,
    period: `${dateRange.start.toISOString()} - ${dateRange.end.toISOString()}`,
    metrics,
  });

  return {
    success: true,
    metrics,
    period: {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    },
  };
}

interface PerformanceMetrics {
  message: string;
}

async function calculatePerformanceMetrics(
  _organizationId: string,
  _dateRange: { start: Date; end: Date },
  job: Job,
): Promise<MetricsResult<PerformanceMetrics>> {
  await job.updateProgress(50);

  // TODO: Implement performance metrics based on OKRs

  await job.updateProgress(100);

  return {
    success: true,
    metrics: {
      message: 'Performance metrics calculation not yet implemented',
    },
    period: {
      start: _dateRange.start.toISOString(),
      end: _dateRange.end.toISOString(),
    },
  };
}

interface SatisfactionMetrics {
  avgMoodRating: string;
  totalMoodCheckins: number;
  surveyResponseRate: number;
}

async function calculateSatisfactionMetrics(
  organizationId: string,
  dateRange: { start: Date; end: Date },
  job: Job,
): Promise<MetricsResult<SatisfactionMetrics>> {
  await job.updateProgress(10);

  // Calculate average mood rating
  const moodRatings = await prisma.checkIn.findMany({
    where: {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
      user: {
        organizationId,
      },
      moodRating: {
        not: null,
      },
    },
    select: {
      moodRating: true,
    },
  });

  await job.updateProgress(50);

  const avgMoodRating =
    moodRatings.length > 0
      ? moodRatings.reduce((sum, c) => sum + (c.moodRating || 0), 0) / moodRatings.length
      : 0;

  // Calculate survey response rate
  const [totalSurveys, completedResponses] = await Promise.all([
    prisma.survey.count({
      where: {
        organizationId,
        startDate: {
          lte: dateRange.end,
        },
        endDate: {
          gte: dateRange.start,
        },
      },
    }),
    prisma.surveyResponse.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        survey: {
          organizationId,
        },
      },
    }),
  ]);

  await job.updateProgress(100);

  const metrics = {
    avgMoodRating: avgMoodRating.toFixed(2),
    totalMoodCheckins: moodRatings.length,
    surveyResponseRate: totalSurveys > 0 ? (completedResponses / totalSurveys) * 100 : 0,
  };

  log.info('Satisfaction metrics calculated', {
    organizationId,
    period: `${dateRange.start.toISOString()} - ${dateRange.end.toISOString()}`,
    metrics,
  });

  return {
    success: true,
    metrics,
    period: {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    },
  };
}

// Worker event handlers
metricsWorker.on('completed', (job) => {
  log.debug('Metrics worker completed job', { jobId: job.id });
});

metricsWorker.on('failed', (job, error) => {
  log.error('Metrics worker job failed', {
    jobId: job?.id,
    error: error.message,
  });
});

// Graceful shutdown
export async function stopMetricsWorker() {
  await metricsWorker.close();
  log.info('Metrics worker stopped');
}
