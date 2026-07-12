// migrations/run.ts — CLI entry point. The actual logic lives in
// src/config/migrate.ts so server.ts (boot) and shared/db/query.ts
// (mid-session self-heal) can reuse it instead of drifting out of sync.
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
