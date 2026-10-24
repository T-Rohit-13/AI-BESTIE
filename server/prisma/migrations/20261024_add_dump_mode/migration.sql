-- ==============================================================================
-- INARO Dump Mode Migration
-- Adds dump_space_name and last_dump_at to users table
-- Creates dump_entries table with indexes and constraints
-- ==============================================================================

-- 1. Ensure users table has dump_space_name and last_dump_at columns
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "dump_space_name" TEXT NOT NULL DEFAULT 'My Dump',
  ADD COLUMN IF NOT EXISTS "last_dump_at" TIMESTAMP NULL;

-- 2. Create dump_entries table
CREATE TABLE IF NOT EXISTS "dump_entries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "text" TEXT NOT NULL,
  "mood" INTEGER NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "chk_dump_entries_mood" CHECK ("mood" IS NULL OR ("mood" >= 1 AND "mood" <= 5))
);

-- 3. Create required indexes
CREATE INDEX IF NOT EXISTS "dump_entries_user_id_idx" ON "dump_entries"("user_id");
CREATE INDEX IF NOT EXISTS "dump_entries_user_id_created_at_idx" ON "dump_entries"("user_id", "created_at" DESC, "id" DESC);
