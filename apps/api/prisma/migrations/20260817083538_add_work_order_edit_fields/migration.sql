-- AlterTable
ALTER TABLE "work_order_events" ADD COLUMN     "actor_id" UUID;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "estimated_duration" INTEGER;
