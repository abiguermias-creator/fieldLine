-- AlterEnum
ALTER TYPE "WorkOrderStatus" ADD VALUE 'AWAITING_PARTS';

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "waiting_on_parts_description" TEXT;
