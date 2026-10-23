-- AlterTable users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notifications_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_notified_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_dump_notification_message_id" TEXT;

-- CreateTable notification_devices
CREATE TABLE IF NOT EXISTS "notification_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "push_token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "notification_devices_user_id_push_token_key" ON "notification_devices"("user_id", "push_token");
CREATE INDEX IF NOT EXISTS "notification_devices_user_id_idx" ON "notification_devices"("user_id");
CREATE INDEX IF NOT EXISTS "notification_devices_push_token_idx" ON "notification_devices"("push_token");

-- AddForeignKey
ALTER TABLE "notification_devices" ADD CONSTRAINT "notification_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
