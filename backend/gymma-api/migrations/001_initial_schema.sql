-- 001_initial_schema.sql
-- Gymma MVP schema. Requires PostGIS.

CREATE EXTENSION IF NOT EXISTS postgis;
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
-- ENUMS
-- ===========================================================================
CREATE TYPE amenity_type AS ENUM (
  'Cardio', 'Weights', 'CrossFit', 'Swimming', 'Steam', 'Sauna',
  'Shower', 'Lockers', 'AC', 'Womens_Section', 'PT',
  'Group_Classes', 'Parking', 'WiFi', 'Cafeteria'
);

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'super_admin');

-- ===========================================================================
-- gyms
-- ===========================================================================
CREATE TABLE gyms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  description      TEXT,
  area             TEXT NOT NULL,
  city             TEXT NOT NULL DEFAULT 'Bengaluru',

  phone            TEXT,
  whatsapp         TEXT,
  address_line     TEXT,
  website          TEXT,

  location         GEOGRAPHY(Point, 4326),
  lat              NUMERIC(10, 7) NOT NULL,
  lng              NUMERIC(10, 7) NOT NULL,

  price_per_month  INTEGER NOT NULL, -- paise

  is_premium       BOOLEAN NOT NULL DEFAULT FALSE,
  women_friendly   BOOLEAN NOT NULL DEFAULT FALSE,
  has_parking      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,

  opens_at         TIME,
  closes_at        TIME,

  profile_score    SMALLINT NOT NULL DEFAULT 0,
  years_operating  SMALLINT,
  cover_image_url  TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

-- keep location in sync with lat/lng automatically
CREATE OR REPLACE FUNCTION gyms_sync_location()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gyms_location
BEFORE INSERT OR UPDATE OF lat, lng ON gyms
FOR EACH ROW EXECUTE FUNCTION gyms_sync_location();

CREATE TRIGGER trg_gyms_updated
BEFORE UPDATE ON gyms
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_gyms_city   ON gyms(city) WHERE deleted_at IS NULL;
CREATE INDEX idx_gyms_area   ON gyms(area) WHERE deleted_at IS NULL;
CREATE INDEX idx_gyms_active ON gyms(is_active, deleted_at);
CREATE INDEX idx_gyms_price  ON gyms(price_per_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_gyms_geo    ON gyms USING GIST(location);
CREATE INDEX idx_gyms_fts ON gyms USING GIN(
  to_tsvector('english', name || ' ' || area || ' ' || city)
);

-- ===========================================================================
-- gym_amenities
-- ===========================================================================
CREATE TABLE gym_amenities (
  gym_id  UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  amenity amenity_type NOT NULL,
  PRIMARY KEY (gym_id, amenity)
);
CREATE INDEX idx_amenities_gym ON gym_amenities(gym_id);

-- ===========================================================================
-- reviews
-- ===========================================================================
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id        UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  author_label  TEXT NOT NULL DEFAULT 'Verified Member',
  rating        NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body          TEXT NOT NULL CHECK (char_length(body) <= 2000),
  helpful_count INTEGER NOT NULL DEFAULT 0,
  source        TEXT NOT NULL DEFAULT 'platform',
  external_id   TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_reviews_gym_id ON reviews(gym_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_reviews_updated
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===========================================================================
-- trainers
-- ===========================================================================
CREATE TABLE trainers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id            UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  photo_url         TEXT,
  years_experience  SMALLINT NOT NULL DEFAULT 0,
  specialization    TEXT NOT NULL,
  price_per_session INTEGER NOT NULL, -- paise
  languages         TEXT[] NOT NULL DEFAULT '{}',
  sort_order        SMALLINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);
CREATE INDEX idx_trainers_gym ON trainers(gym_id) WHERE deleted_at IS NULL;

-- ===========================================================================
-- membership_plans
-- ===========================================================================
CREATE TABLE membership_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id           UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  duration_months  SMALLINT NOT NULL,
  price            INTEGER NOT NULL, -- paise
  benefits         TEXT[] NOT NULL DEFAULT '{}',
  is_recommended   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order       SMALLINT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);
CREATE INDEX idx_plans_gym ON membership_plans(gym_id) WHERE deleted_at IS NULL;

-- ===========================================================================
-- gym_classes
-- ===========================================================================
CREATE TABLE gym_classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id        UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  schedule      TEXT NOT NULL,
  duration_min  SMALLINT NOT NULL,
  trainer_name  TEXT NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_classes_gym ON gym_classes(gym_id) WHERE deleted_at IS NULL;

-- ===========================================================================
-- gym_faqs
-- ===========================================================================
CREATE TABLE gym_faqs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id     UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_faqs_gym ON gym_faqs(gym_id);

-- ===========================================================================
-- gym_gallery
-- ===========================================================================
CREATE TABLE gym_gallery (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id      UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_gallery_gym ON gym_gallery(gym_id);

-- ===========================================================================
-- gym_certifications
-- ===========================================================================
CREATE TABLE gym_certifications (
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  label  TEXT NOT NULL,
  PRIMARY KEY (gym_id, label)
);

-- ===========================================================================
-- inquiries
-- ===========================================================================
CREATE TABLE inquiries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id        UUID NOT NULL REFERENCES gyms(id),
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  message       TEXT CHECK (char_length(message) <= 500),
  plan_interest TEXT,
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'contacted', 'joined', 'lost')),
  source_page   TEXT,
  utm_source    TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inquiries_gym    ON inquiries(gym_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_date   ON inquiries(created_at DESC);

CREATE TRIGGER trg_inquiries_updated
BEFORE UPDATE ON inquiries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===========================================================================
-- demo_requests
-- ===========================================================================
CREATE TABLE demo_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT NOT NULL,
  gym_name     TEXT NOT NULL,
  city         TEXT,
  area         TEXT,
  member_count TEXT,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'contacted', 'onboarded', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_demo_requests_updated
BEFORE UPDATE ON demo_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===========================================================================
-- users
-- ===========================================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash   TEXT,
  role            user_role NOT NULL DEFAULT 'owner',
  google_id       TEXT UNIQUE,
  full_name       TEXT,
  avatar_url      TEXT,
  phone           TEXT,
  failed_attempts SMALLINT NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===========================================================================
-- owner_gym_links
-- ===========================================================================
CREATE TABLE owner_gym_links (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_id     UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, gym_id)
);

-- ===========================================================================
-- refresh_tokens
-- ===========================================================================
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rt_user   ON refresh_tokens(user_id);
CREATE INDEX idx_rt_expiry ON refresh_tokens(expires_at);

-- ===========================================================================
-- password_reset_tokens (used by /auth/forgot-password)
-- ===========================================================================
CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_prt_user ON password_reset_tokens(user_id);

-- ===========================================================================
-- page_views
-- ===========================================================================
CREATE TABLE page_views (
  id       BIGSERIAL PRIMARY KEY,
  gym_id   UUID REFERENCES gyms(id),
  path     TEXT NOT NULL,
  referrer TEXT,
  ts       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pv_gym_ts ON page_views(gym_id, ts DESC);

CREATE TABLE gym_daily_stats (
  gym_id      UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  day         DATE NOT NULL,
  view_count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (gym_id, day)
);
