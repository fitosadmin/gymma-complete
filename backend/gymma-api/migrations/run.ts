// migrations/run.ts — CLI entry point. The actual logic lives in
// src/config/migrate.ts so server.ts (boot self-heal) and this script share
// one implementation instead of two copies that can silently drift apart —
// exactly what had happened here (this file had its own separate,
// out-of-date desync-detection logic with no advisory lock).
import 'dotenv/config';
import { runMigrations } from '../src/config/migrate';

runMigrations()
  .then(() => {
    console.log('migrations done');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
