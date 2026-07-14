-- 001_broadcasts.sql
-- Broadcast messaging schema: gym-wide announcements, delivery receipts,
-- and registered push-notification devices.
--
-- Runs against the SAME database as the main gymma-api (shared DATABASE_URL).
-- `gyms`, `users`, `gym_members`, and `owner_gym_links` already exist there
-- (see backend/gymma-api/migrations/001_initial_schema.sql) and are read-only
-- from this service — used to resolve gym ownership, membership, and
-- fan-out recipients — and are intentionally not created or altered here.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ===========================================================================
-- broadcasts
-- ===========================================================================
CREATE TABLE IF NOT EXISTS broadcasts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id     UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id),
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(20) NOT NULL DEFAULT 'announcement'
             CHECK (type IN ('announcement', 'alert', 'update')),
  priority   VARCHAR(20) NOT NULL DEFAULT 'normal'
             CHECK (priority IN ('low', 'normal', 'high')),
  status     VARCHAR(20) NOT NULL DEFAULT 'sent'
             CHECK (status IN ('draft', 'sent', 'failed', 'deleted')),
  sent_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_gym_sent ON broadcasts(gym_id, sent_at DESC);

CREATE OR REPLACE TRIGGER trg_broadcasts_updated
BEFORE UPDATE ON broadcasts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===========================================================================
-- broadcast_receipts
-- ===========================================================================
CREATE TABLE IF NOT EXISTS broadcast_receipts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id  UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_id        UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  read_at       TIMESTAMP NULL,
  delivered_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (broadcast_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_receipts_gym_user_read ON broadcast_receipts(gym_id, user_id, is_read);

-- ===========================================================================
-- user_devices
-- ===========================================================================
CREATE TABLE IF NOT EXISTS user_devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token     VARCHAR(512) NOT NULL,
  platform      VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  device_id     VARCHAR(255) NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(fcm_token);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id) WHERE is_active = TRUE;

-- ===========================================================================
-- device_push_failures — tracks consecutive FCM failures per device so the
-- daily cleanup job can deactivate persistently-failing tokens.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS device_push_failures (
  fcm_token             VARCHAR(512) PRIMARY KEY,
  consecutive_failures  SMALLINT NOT NULL DEFAULT 0,
  last_failed_at        TIMESTAMP
);
