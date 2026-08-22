-- CreateTable
CREATE TABLE "routing_cache" (
    "id" UUID NOT NULL,
    "from_latitude" DOUBLE PRECISION NOT NULL,
    "from_longitude" DOUBLE PRECISION NOT NULL,
    "to_latitude" DOUBLE PRECISION NOT NULL,
    "to_longitude" DOUBLE PRECISION NOT NULL,
    "travel_minutes" INTEGER NOT NULL,
    "distance_km" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "routing_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routing_cache_from_latitude_from_longitude_to_latitude_to_l_key" ON "routing_cache"("from_latitude", "from_longitude", "to_latitude", "to_longitude");
