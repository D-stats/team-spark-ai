import {
  emailQueue,
  slackQueue,
  reportQueue,
  maintenanceQueue,
  notificationQueue,
  checkinQueue,
  metricsQueue,
  closeQueues,
} from '../src/lib/jobs/queue';
import { closeRedis } from '../src/lib/redis';

async function cleanJobs() {
  console.log('🧹 Cleaning job queues...');

  const queues = [
    emailQueue,
    slackQueue,
    reportQueue,
    maintenanceQueue,
    notificationQueue,
    checkinQueue,
    metricsQueue,
  ];

  for (const queue of queues) {
    try {
      // Clean completed jobs
      const completed = await queue.clean(0, 1000, 'completed');
      console.log(`✅ Cleaned ${completed.length} completed jobs from ${queue.name}`);

      // Clean failed jobs older than 24 hours
      const failed = await queue.clean(24 * 60 * 60 * 1000, 1000, 'failed');
      console.log(`❌ Cleaned ${failed.length} failed jobs from ${queue.name}`);

      // Get queue counts
      const counts = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);

      console.log(
        `📊 ${queue.name}: waiting=${counts[0]}, active=${counts[1]}, completed=${counts[2]}, failed=${counts[3]}`,
      );
    } catch (error) {
      console.error(`Error cleaning ${queue.name}:`, error);
    }
  }

  // Close connections
  await closeQueues();
  await closeRedis();

  console.log('✨ Job cleanup completed!');
  process.exit(0);
}

cleanJobs().catch((error) => {
  console.error('Failed to clean jobs:', error);
  process.exit(1);
});
