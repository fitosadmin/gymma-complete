// src/jobs/aggregateDailyStats.ts
// Run daily (e.g. via cron / a scheduler). Rolls yesterday's page_views into
// gym_daily_stats so dashboard queries stay fast, then refreshes the rating view.
import { query } from '../shared/db/query';
import { logger } from '../config/logger';

export async function aggregateDailyStats(): Promise<void> {
  await query(
    `INSERT INTO gym_daily_stats (gym_id, day, view_count)
     SELECT gym_id, (ts AT TIME ZONE 'Asia/Kolkata')::date AS day, COUNT(*)
       FROM page_views
      WHERE gym_id IS NOT NULL
        AND ts >= NOW() - INTERVAL '2 days'
      GROUP BY gym_id, day
     ON CONFLICT (gym_id, day)
     DO UPDATE SET view_count = EXCLUDED.view_count`,
  );

  await query('SELECT refresh_gym_rating_summary()');
  logger.info('daily stats aggregated + rating summary refreshed');
}

// Allow running standalone: `tsx src/jobs/aggregateDailyStats.ts`
if (require.main === module) {
  aggregateDailyStats()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'aggregateDailyStats failed');
      process.exit(1);
    });
}
