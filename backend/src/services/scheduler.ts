import cron from 'node-cron';
import { PollerService } from './poller.service';
import { logger } from '../utils/logger';

/**
 * Initializes and starts the automated cron job scheduler.
 * Runs synchronization of all active API providers every 15 minutes.
 * Captures all errors to ensure server stability.
 */
export function startScheduler(): cron.ScheduledTask {
  const cronSchedule = '*/15 * * * *';
  logger.info(`⏰ [Scheduler] Registering automated provider sync job with interval: "${cronSchedule}" (every 15 minutes)`);

  const task = cron.schedule(cronSchedule, async () => {
    logger.info('⏰ [Scheduler] Starting scheduled 15-minute synchronization cycle for active providers...');
    try {
      await PollerService.pollAllProviders();
      logger.info('✅ [Scheduler] Provider synchronization cycle finished successfully.');
    } catch (err: any) {
      logger.error(`❌ [Scheduler] Unexpected error during automated provider synchronization: ${err?.message || err}`);
    }
  });

  return task;
}
