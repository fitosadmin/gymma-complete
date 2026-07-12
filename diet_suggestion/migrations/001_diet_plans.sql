-- 001_diet_plans.sql
-- Diet suggestion plans: one row per BMR/TDEE/macro calculation.
--
-- Runs against the SAME database as the main gymma-api (shared DATABASE_URL).
-- `users` and `refresh_tokens` already exist there (see
-- backend/gymma-api/migrations/001_initial_schema.sql) and are read/written
-- by this service's auth module but intentionally not created here.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

CREATE TABLE IF NOT EXISTS diet_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  age              INTEGER NOT NULL,
  gender           TEXT NOT NULL,
  weight_kg        NUMERIC(6,2) NOT NULL,
  height_cm        NUMERIC(6,2) NOT NULL,
  goal             TEXT NOT NULL,
  activity_key     TEXT NOT NULL,
  dietary_pattern  TEXT NOT NULL,
  optional_inputs  JSONB,

  bmr              INTEGER NOT NULL,
  tdee             INTEGER NOT NULL,
  target_calories  INTEGER NOT NULL,

  protein_g        INTEGER NOT NULL,
  carbs_g          INTEGER NOT NULL,
  fat_g            INTEGER NOT NULL,

  breakfast_cal    INTEGER NOT NULL,
  lunch_cal        INTEGER NOT NULL,
  dinner_cal       INTEGER NOT NULL,
  snacks_cal       INTEGER NOT NULL,

  notes            TEXT[] NOT NULL DEFAULT '{}',
  warnings         TEXT[] NOT NULL DEFAULT '{}',
  user_note        TEXT,
  label            TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_diet_plans_user_active
  ON diet_plans(user_id, created_at DESC)
  WHERE deleted_at IS NULL;
