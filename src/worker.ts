#!/usr/bin/env node

import 'dotenv/config';
import { startWorkers, stopWorkers } from '@/lib/jobs/workers';
import { scheduleJobs, unscheduleJobs } from '@/lib/jobs/scheduler';
import { setupQueueMonitoring, getAllQueueMetrics } from '@/lib/jobs/queue';
import {
  emailQueue,
  slackQueue,
  reportQueue,
  maintenanceQueue,
  notificationQueue,
  checkinQueue,
  metricsQueue,
} from '@/lib/jobs/queue';
import { log } from '@/lib/logger';
import { closeRedis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

// Start monitoring for all queues
const queueEvents = [
  setupQueueMonitoring(emailQueue),
  setupQueueMonitoring(slackQueue),
  setupQueueMonitoring(reportQueue),
  setupQueueMonitoring(maintenanceQueue),
  setupQueueMonitoring(notificationQueue),
  setupQueueMonitoring(checkinQueue),
  setupQueueMonitoring(metricsQueue),
];

// Main worker process
async function main() {
  log.info('Starting TeamSpark AI worker process...');

  try {
    // Start workers
    startWorkers();

    // Schedule recurring jobs
    await scheduleJobs();

    // Log queue metrics every minute
    setInterval(async () => {
      try {
        const metrics = await getAllQueueMetrics();
        log.info('Queue metrics', { metrics });
      } catch (error) {
        log.error('Failed to get queue metrics', { error: (error as Error).message });
      }
    }, 60000);

    log.info('Worker process started successfully');
  } catch (error) {
    log.error('Failed to start worker process', { error: (error as Error).message });
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  log.info('Shutting down worker process...');

  try {
    // Stop scheduling new jobs
    await unscheduleJobs();

    // Stop workers
    await stopWorkers();

    // Close queue event listeners
    await Promise.all(queueEvents.map((events) => events.close()));

    // Close database connection
    await prisma.$disconnect();

    // Close Redis connection
    await closeRedis();

    log.info('Worker process shut down successfully');
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown', { error: (error as Error).message });
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', { error: error.message, stack: error.stack });
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection', { reason, promise });
  shutdown();
});

// Start the worker
main();
