// src/modules/gymma/gymma.jobs.ts
import cron from 'node-cron';
import { logger } from '../../config/logger';
import * as service from './gymma.service';

/**
 * Daily recalculation at 2:00 AM server time.
 * Recomputes every gym's Bayesian score/tier from valid submissions in the past 365 days.
 * Also writes a daily score history snapshot (used for trend charts and tier stabilization).
 * The ON CONFLICT upsert in insertScoreHistorySnapshot ensures idempotency if run twice.
 */
function scheduleDailyRecalculation(): void {
  cron.schedule('0 2 * * *', async () => {
    logger.info('gymma: starting daily recalculation job');
    try {
      const result = await service.recalculateAllGyms();
      logger.info({ result }, 'gymma: daily recalculation job complete');
    } catch (err) {
      logger.error({ err }, 'gymma: daily recalculation job failed');
    }
  });
}

/**
 * Quarterly EWM recalculation at 3:00 AM on the 1st of Jan/Apr/Jul/Oct.
 * Recomputes dimension weights using the Entropy Weight Method across all
 * gyms that meet the minimum review threshold (GYMMA_MIN_REVIEWS_PUBLIC).
 */
function scheduleQuarterlyEwm(): void {
  cron.schedule('0 3 1 1,4,7,10 *', async () => {
    logger.info('gymma: starting quarterly EWM recalculation job');
    try {
      const result = await service.runEwmRecalculation();
      logger.info({ result }, 'gymma: quarterly EWM recalculation complete');
    } catch (err) {
      logger.error({ err }, 'gymma: quarterly EWM recalculation failed');
    }
  });
}

/** Register all Gymma background jobs. Call this once after the database is ready. */
export function registerGymmaJobs(): void {
  scheduleDailyRecalculation();
  scheduleQuarterlyEwm();
  logger.info('gymma: scheduled jobs registered (daily recalculation, quarterly EWM)');
}
