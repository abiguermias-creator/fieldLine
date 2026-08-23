-- CreateTable
CREATE TABLE "work_logs" (
    "id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "technician_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "minutes_spent" INTEGER NOT NULL,
    "parts_used" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_logs_work_order_id_created_at_idx" ON "work_logs"("work_order_id", "created_at");

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
