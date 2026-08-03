-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "technician_id" UUID;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
