-- INARO — Dump Mode Database Migration
-- Safe to execute against existing database without data loss.

-- 1. Ensure users table has dump_space_name and last_dump_at
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "dump_space_name" TEXT NOT NULL DEFAULT 'My Dump',
  ADD COLUMN IF NOT EXISTS "last_dump_at" TIMESTAMP(3);

-- 2. Create dump_entries table
CREATE TABLE IF NOT EXISTS "dump_entries" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "mood" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dump_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dump_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "dump_entries_mood_check" CHECK ("mood" IS NULL OR ("mood" >= 1 AND "mood" <= 5))
);

-- 3. Create required index on user_id
CREATE INDEX IF NOT EXISTS "dump_entries_user_id_idx" ON "dump_entries"("user_id");

-- 4. Create composite descending index for cursor-based pagination
CREATE INDEX IF NOT EXISTS "dump_entries_user_id_created_at_id_idx" ON "dump_entries"("user_id", "created_at" DESC, "id" DESC);
