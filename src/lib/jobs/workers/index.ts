import { emailWorker, stopEmailWorker } from './email.worker';
import { slackWorker, stopSlackWorker } from './slack.worker';
import { metricsWorker, stopMetricsWorker } from './metrics.worker';
import { log } from '@/lib/logger';

// Export all workers
export { emailWorker, slackWorker, metricsWorker };

// Start all workers
export function startWorkers(): void {
  log.info('Starting background job workers...');

  // Workers are automatically started when imported
  // This function is for explicit initialization if needed

  log.info('Background job workers started', {
    workers: [emailWorker.name, slackWorker.name, metricsWorker.name],
  });
}

// Stop all workers gracefully
export async function stopWorkers(): Promise<void> {
  log.info('Stopping background job workers...');

  await Promise.all([stopEmailWorker(), stopSlackWorker(), stopMetricsWorker()]);

  log.info('All background job workers stopped');
}

// Handle process signals for graceful shutdown
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', async () => {
    log.info('SIGTERM received, shutting down workers...');
    await stopWorkers();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    log.info('SIGINT received, shutting down workers...');
    await stopWorkers();
    process.exit(0);
  });
}
