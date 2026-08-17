-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "original_work_order_id" UUID;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_original_work_order_id_fkey" FOREIGN KEY ("original_work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
