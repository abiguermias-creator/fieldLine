/*
  Warnings:

  - Made the column `address` on table `sites` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "sites" DROP CONSTRAINT "sites_client_id_fkey";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "access_notes" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ALTER COLUMN "address" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
