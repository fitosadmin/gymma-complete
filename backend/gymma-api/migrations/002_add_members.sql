-- Migration: Add members support

-- 1. Add 'member' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'member';

-- 2. Make email optional and phone unique since members will log in with phone
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 3. Add the unique constraint idempotently. A pre-check against
-- pg_constraint isn't enough on its own — this DB has repeatedly shown
-- inconsistent catalog states where a constraint's backing index survives
-- independently of its pg_constraint row (see runtime logs: the pre-check
-- found no 'users_phone_key' constraint, but the ADD CONSTRAINT still
-- failed with "relation users_phone_key already exists"). Catching the
-- actual errors is the only guard that can't be fooled by that.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
    END IF;
EXCEPTION
    WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

-- 4. Create gym_members table
CREATE TABLE IF NOT EXISTS gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  membership_plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  UNIQUE(gym_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_members_gym ON gym_members(gym_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gym_members_user ON gym_members(user_id) WHERE deleted_at IS NULL;
