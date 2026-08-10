/*
  Warnings:

  - The values [URGENT] on the enum `WorkOrderPriority` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `longitude` on table `geocode_cache` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WorkOrderPriority_new" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
ALTER TABLE "public"."work_orders" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "work_orders" ALTER COLUMN "priority" TYPE "WorkOrderPriority_new" USING ("priority"::text::"WorkOrderPriority_new");
ALTER TYPE "WorkOrderPriority" RENAME TO "WorkOrderPriority_old";
ALTER TYPE "WorkOrderPriority_new" RENAME TO "WorkOrderPriority";
DROP TYPE "public"."WorkOrderPriority_old";
ALTER TABLE "work_orders" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';
COMMIT;

-- AlterTable
ALTER TABLE "geocode_cache" ALTER COLUMN "longitude" SET NOT NULL;
