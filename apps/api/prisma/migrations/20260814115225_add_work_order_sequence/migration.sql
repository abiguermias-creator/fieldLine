-- CreateTable
CREATE TABLE "work_order_sequences" (
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "work_order_sequences_pkey" PRIMARY KEY ("year")
);
