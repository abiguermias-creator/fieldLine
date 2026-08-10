-- CreateTable
CREATE TABLE "geocode_cache" (
    "id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "geocode_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "geocode_cache_address_city_key"
ON "geocode_cache"("address", "city");