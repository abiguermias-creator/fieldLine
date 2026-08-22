-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "daily_hours_override" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "daily_hours_override_reason" TEXT,
ADD COLUMN     "daily_hours_override_rules" TEXT;
