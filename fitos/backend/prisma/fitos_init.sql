-- Fitos schema initialization: creates only fitos-specific tables.
-- Safe to run on a DB that already has the gymma-api tables (gyms, users, etc.).
-- Uses DO blocks so it skips gracefully if types/tables already exist.

-- ============================================
-- ENUMS (fitos-only)
-- ============================================

DO $$ BEGIN
  CREATE TYPE "MovementPattern" AS ENUM (
    'PUSH_HORZ','PUSH_VERT','PULL_HORZ','PULL_VERT',
    'SQUAT','HINGE','LUNGE','CARRY','ROTATION','CORE_ANTI','ISOLATION'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "JointComplexity" AS ENUM ('compound', 'isolation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PlaneOfMotion" AS ENUM ('sagittal', 'frontal', 'transverse', 'multi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Severity" AS ENUM ('absolute', 'relative', 'caution');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Goal" AS ENUM (
    'Strength','Hypertrophy','Endurance','Power','General_Health','Recomposition'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EquipmentCode" AS ENUM (
    'BB','DB','KB','MACHINE','CABLE','BW','BAND','TRX','SM','MEDBALL'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- EXERCISE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS "exercises" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "primary_pattern" "MovementPattern" NOT NULL,
    "joint_complexity" "JointComplexity" NOT NULL,
    "plane_of_motion" "PlaneOfMotion" NOT NULL,
    "difficulty_score" INTEGER NOT NULL,
    "stability_demand" INTEGER NOT NULL,
    "coordination_complexity" INTEGER NOT NULL,
    "mobility_required" INTEGER NOT NULL,
    "injury_risk_factor" INTEGER NOT NULL,
    "goal_strength" INTEGER NOT NULL,
    "goal_hypertrophy" INTEGER NOT NULL,
    "goal_endurance" INTEGER NOT NULL,
    "goal_power" INTEGER NOT NULL,
    "experience_minimum" INTEGER NOT NULL,
    "video_url" TEXT,
    "image_url" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "exercises_code_key" ON "exercises"("code");
CREATE INDEX IF NOT EXISTS "exercises_difficulty_score_experience_minimum_idx"
  ON "exercises"("difficulty_score", "experience_minimum");

CREATE TABLE IF NOT EXISTS "muscles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_major" BOOLEAN NOT NULL,
    "parent_id" UUID,
    CONSTRAINT "muscles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "muscles_name_key" ON "muscles"("name");

DO $$ BEGIN
  ALTER TABLE "muscles" ADD CONSTRAINT "muscles_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "muscles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "exercise_muscles" (
    "exercise_id" UUID NOT NULL,
    "muscle_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "exercise_muscles_pkey" PRIMARY KEY ("exercise_id","muscle_id")
);

CREATE INDEX IF NOT EXISTS "exercise_muscles_muscle_id_role_idx"
  ON "exercise_muscles"("muscle_id", "role");

DO $$ BEGIN
  ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_exercise_id_fkey"
    FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_muscle_id_fkey"
    FOREIGN KEY ("muscle_id") REFERENCES "muscles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "equipment" (
    "id" UUID NOT NULL,
    "code" "EquipmentCode" NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_code_key" ON "equipment"("code");

CREATE TABLE IF NOT EXISTS "exercise_equipment" (
    "exercise_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "exercise_equipment_pkey" PRIMARY KEY ("exercise_id","equipment_id")
);

DO $$ BEGIN
  ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_exercise_id_fkey"
    FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_equipment_id_fkey"
    FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "contraindications" (
    "id" UUID NOT NULL,
    "flag" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "contraindications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "contraindications_flag_key" ON "contraindications"("flag");

CREATE TABLE IF NOT EXISTS "exercise_contraindications" (
    "exercise_id" UUID NOT NULL,
    "contraindication_id" UUID NOT NULL,
    "severity" "Severity" NOT NULL,
    CONSTRAINT "exercise_contraindications_pkey" PRIMARY KEY ("exercise_id","contraindication_id")
);

DO $$ BEGIN
  ALTER TABLE "exercise_contraindications" ADD CONSTRAINT "exercise_contraindications_exercise_id_fkey"
    FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "exercise_contraindications" ADD CONSTRAINT "exercise_contraindications_contraindication_id_fkey"
    FOREIGN KEY ("contraindication_id") REFERENCES "contraindications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "exercise_progressions" (
    "from_exercise_id" UUID NOT NULL,
    "to_exercise_id" UUID NOT NULL,
    "progression_type" TEXT NOT NULL,
    CONSTRAINT "exercise_progressions_pkey" PRIMARY KEY ("from_exercise_id","to_exercise_id")
);

DO $$ BEGIN
  ALTER TABLE "exercise_progressions" ADD CONSTRAINT "exercise_progressions_from_exercise_id_fkey"
    FOREIGN KEY ("from_exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "exercise_progressions" ADD CONSTRAINT "exercise_progressions_to_exercise_id_fkey"
    FOREIGN KEY ("to_exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "gym_exercise_database" (
    "gym_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "custom_notes" TEXT,
    CONSTRAINT "gym_exercise_database_pkey" PRIMARY KEY ("gym_id","exercise_id")
);

CREATE INDEX IF NOT EXISTS "gym_exercise_database_gym_id_is_available_idx"
  ON "gym_exercise_database"("gym_id", "is_available");

DO $$ BEGIN
  ALTER TABLE "gym_exercise_database" ADD CONSTRAINT "gym_exercise_database_gym_id_fkey"
    FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "gym_exercise_database" ADD CONSTRAINT "gym_exercise_database_exercise_id_fkey"
    FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "exercise_audit_log" (
    "id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "changed_by" UUID NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "field_changed" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "change_reason" TEXT,
    CONSTRAINT "exercise_audit_log_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "exercise_audit_log" ADD CONSTRAINT "exercise_audit_log_exercise_id_fkey"
    FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- ASSESSMENT & WORKOUT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS "assessments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "responses" JSONB NOT NULL,
    "computed_vector" JSONB NOT NULL,
    "experience_score" INTEGER NOT NULL,
    "safety_flags" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "workout_plans" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "metadata" JSONB NOT NULL,
    "program_parameters" JSONB NOT NULL,
    "sessions" JSONB NOT NULL,
    "progression_rules" JSONB NOT NULL,
    "safety_flags" JSONB NOT NULL,
    "adaptation_log" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deload_triggered" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "workout_plans_assessment_id_key" ON "workout_plans"("assessment_id");

DO $$ BEGIN
  ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_assessment_id_fkey"
    FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "workout_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "session_date" TIMESTAMPTZ(6) NOT NULL,
    "day_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "duration_minutes" INTEGER,
    "rpe_average" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "workout_sessions_user_id_plan_id_session_date_idx"
  ON "workout_sessions"("user_id", "plan_id", "session_date");

DO $$ BEGIN
  ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "workout_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "performance_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "session_id" UUID,
    "session_date" TIMESTAMPTZ(6) NOT NULL,
    "sets" JSONB NOT NULL,
    "completed_sets" INTEGER NOT NULL DEFAULT 0,
    "target_sets" INTEGER NOT NULL DEFAULT 0,
    "max_load" DOUBLE PRECISION,
    "estimated_e1rm" DOUBLE PRECISION,
    "notes" TEXT,
    CONSTRAINT "performance_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "performance_logs_user_id_exercise_id_session_date_idx"
  ON "performance_logs"("user_id", "exercise_id", "session_date");

DO $$ BEGIN
  ALTER TABLE "performance_logs" ADD CONSTRAINT "performance_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "performance_logs" ADD CONSTRAINT "performance_logs_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "personal_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "record_date" TIMESTAMPTZ(6) NOT NULL,
    "e1rm" DOUBLE PRECISION NOT NULL,
    "load" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "personal_records_user_id_exercise_id_key"
  ON "personal_records"("user_id", "exercise_id");
CREATE INDEX IF NOT EXISTS "personal_records_user_id_record_date_idx"
  ON "personal_records"("user_id", "record_date");

DO $$ BEGIN
  ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
