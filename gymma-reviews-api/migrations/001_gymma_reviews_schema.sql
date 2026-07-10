-- 001_gymma_reviews_schema.sql
-- Gymma Review System: dimensions, poll questions, submissions, gym scores, score history.
--
-- This was missing from the original delivery (package.json referenced
-- migrations/run.ts and migrations/003_seed_bengaluru_gyms.ts but no
-- migrations/ directory existed at all). Reconstructed from the actual
-- query shapes in src/modules/gymma/gymma.repository.ts + gymma.types.ts,
-- not from the (partially inaccurate) gymma_reviews_api_report.md.
--
-- REQUIRES: this database must already have `gyms` and `gym_members`
-- (backend/gymma-api migrations 001 + 002) applied first — gymma_gym_scores
-- and gymma_submissions reference gyms(id), and submitPoll checks gym_members.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Dimensions — 6 canonical scoring dimensions + 1 non-scoring 'meta' bucket
-- for NPS/overall questions (see calculateDimensionScores.ts).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gymma_dimensions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  weight       NUMERIC(5,4) NOT NULL DEFAULT 0
);

INSERT INTO gymma_dimensions (key, name, description, weight) VALUES
  ('equipment',   'Equipment',   'Quality, condition and availability of gym equipment', 0.1667),
  ('cleanliness', 'Cleanliness', 'Cleanliness of workout floors, locker rooms and showers', 0.1667),
  ('staff',       'Staff',       'Trainer knowledge, helpfulness and floor presence', 0.1667),
  ('environment', 'Environment', 'Atmosphere, temperature and overall comfort', 0.1667),
  ('value',       'Value',       'Whether the membership price matches what you get', 0.1667),
  ('safety',      'Safety',      'Physical safety and emergency preparedness', 0.1667),
  ('meta',        'Meta',        'Non-scoring questions (NPS, overall experience)', 0)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Poll questions — 15 total: 13 canonical (spread across the 6 scoring
-- dimensions) + Q14 (NPS) + Q15 (overall), both 'meta'.
-- response_type drives which widget the client renders; the *value* the
-- client submits must always be an integer 0-100 (see normalizeResponses.ts).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gymma_poll_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id    UUID NOT NULL REFERENCES gymma_dimensions(id) ON DELETE RESTRICT,
  question_number INTEGER NOT NULL UNIQUE,
  question_text   TEXT NOT NULL,
  response_type   TEXT NOT NULL CHECK (response_type IN ('likert5','binary3','overall5','nps11','frequency5')),
  display_order   INTEGER NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO gymma_poll_questions (dimension_id, question_number, question_text, response_type, display_order)
SELECT d.id, q.question_number, q.question_text, q.response_type, q.question_number
FROM (VALUES
  ('equipment',   1,  'How would you rate the quality and condition of the gym equipment?', 'overall5'),
  ('equipment',   2,  'There''s rarely a long wait to use the equipment I need.', 'likert5'),
  ('cleanliness', 3,  'How clean are the workout floors and equipment?', 'overall5'),
  ('cleanliness', 4,  'How clean are the locker rooms and showers?', 'overall5'),
  ('staff',       5,  'How would you rate the trainers'' knowledge and helpfulness?', 'overall5'),
  ('staff',       6,  'Staff are welcoming and easy to approach with questions.', 'likert5'),
  ('staff',       7,  'How often do you see staff actively present on the floor?', 'frequency5'),
  ('environment', 8,  'How would you rate the overall atmosphere and energy of the gym?', 'overall5'),
  ('environment', 9,  'The temperature and ventilation are comfortable during workouts.', 'likert5'),
  ('value',       10, 'The membership price feels fair for what I get.', 'likert5'),
  ('value',       11, 'Does this gym offer good value compared to others nearby?', 'binary3'),
  ('safety',      12, 'I feel physically safe using the equipment here.', 'likert5'),
  ('safety',      13, 'Is a first-aid kit and emergency procedure visible at this gym?', 'binary3'),
  ('meta',        14, 'How likely are you to recommend this gym to a friend or colleague?', 'nps11'),
  ('meta',        15, 'Overall, how would you rate your experience at this gym?', 'overall5')
) AS q(dimension_key, question_number, question_text, response_type)
JOIN gymma_dimensions d ON d.key = q.dimension_key
ON CONFLICT (question_number) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gymma_submissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id              UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_hash         TEXT NOT NULL,
  credibility_weight  NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  responses           JSONB NOT NULL,
  dimension_scores    JSONB NOT NULL,
  raw_score           NUMERIC(6,2) NOT NULL,
  submission_time_ms  INTEGER,
  is_valid            BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gymma_submissions_gym ON gymma_submissions(gym_id);
CREATE INDEX IF NOT EXISTS idx_gymma_submissions_cooldown ON gymma_submissions(gym_id, member_hash, created_at);

-- ---------------------------------------------------------------------------
-- Gym scores — one row per gym. recalculateGymScore() requires this row to
-- already exist ("has it been seeded?"), so every current gym gets one here;
-- gyms created after this migration need a row inserted at onboarding time.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gymma_gym_scores (
  gym_id              UUID PRIMARY KEY REFERENCES gyms(id) ON DELETE CASCADE,
  bayesian_score      NUMERIC(6,2) NOT NULL DEFAULT 50,
  raw_avg_score       NUMERIC(6,2) NOT NULL DEFAULT 50,
  tier                TEXT NOT NULL DEFAULT 'none',
  review_count        INTEGER NOT NULL DEFAULT 0,
  dimension_scores    JSONB NOT NULL DEFAULT '{}',
  bayesian_c          NUMERIC(6,2) NOT NULL DEFAULT 50,
  bayesian_m          INTEGER NOT NULL DEFAULT 30,
  trend_direction     TEXT,
  last_calculated_at  TIMESTAMPTZ,
  tier_changed_at     TIMESTAMPTZ
);

INSERT INTO gymma_gym_scores (gym_id)
SELECT id FROM gyms
ON CONFLICT (gym_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Score history — one snapshot per gym per day.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gymma_score_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id         UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  bayesian_score NUMERIC(6,2) NOT NULL,
  tier           TEXT NOT NULL,
  review_count   INTEGER NOT NULL,
  snapshot_date  DATE NOT NULL,
  UNIQUE(gym_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_gymma_score_history_gym ON gymma_score_history(gym_id, snapshot_date);
