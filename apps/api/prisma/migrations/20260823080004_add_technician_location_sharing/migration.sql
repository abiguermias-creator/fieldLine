-- AlterTable
ALTER TABLE "technician_profiles" ADD COLUMN     "currentLatitude" DOUBLE PRECISION,
ADD COLUMN     "currentLongitude" DOUBLE PRECISION,
ADD COLUMN     "last_location_at" TIMESTAMPTZ(6),
ADD COLUMN     "location_sharing_enabled" BOOLEAN NOT NULL DEFAULT true;
