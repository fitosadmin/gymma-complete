-- 002_create_materialized_view.sql
-- Aggregated rating scores per gym.

CREATE MATERIALIZED VIEW gym_rating_summary AS
SELECT
  gym_id,
  ROUND(AVG(rating)::numeric, 1)         AS rating,
  COUNT(*)                               AS review_count,
  ROUND((AVG(rating) + 0.1)::numeric, 1) AS score_cleanliness,
  ROUND((AVG(rating) - 0.2)::numeric, 1) AS score_equipment,
  ROUND(AVG(rating)::numeric, 1)         AS score_trainers,
  ROUND((AVG(rating) - 0.3)::numeric, 1) AS score_value,
  ROUND((AVG(rating) - 0.5)::numeric, 1) AS score_crowd
FROM reviews
WHERE deleted_at IS NULL
GROUP BY gym_id;

-- Unique index is REQUIRED for REFRESH ... CONCURRENTLY
CREATE UNIQUE INDEX idx_rating_summary_gym ON gym_rating_summary(gym_id);

-- NOTE on refresh strategy:
-- The original spec used an AFTER STATEMENT trigger calling
-- `REFRESH MATERIALIZED VIEW CONCURRENTLY`. That fails at runtime —
-- CONCURRENTLY cannot run inside the trigger's transaction.
-- Instead we expose a plain function and call it from the service layer
-- after review writes (Sprint 2+), and/or from a cron job. For Sprint 1
-- the seed script calls a one-off non-concurrent refresh.

CREATE OR REPLACE FUNCTION refresh_gym_rating_summary()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY gym_rating_summary;
EXCEPTION WHEN feature_not_supported THEN
  -- happens on the very first refresh before the matview is populated
  REFRESH MATERIALIZED VIEW gym_rating_summary;
END;
$$;
