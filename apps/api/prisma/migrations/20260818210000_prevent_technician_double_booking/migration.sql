CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "work_orders"
ADD CONSTRAINT "work_orders_no_technician_double_booking"
EXCLUDE USING GIST (
  "technician_id" WITH =,
  tstzrange("scheduled_at", "scheduled_end_at", '[)') WITH &&
)
WHERE (
  "technician_id" IS NOT NULL
  AND "scheduled_at" IS NOT NULL
  AND "scheduled_end_at" IS NOT NULL
  AND "status" NOT IN ('COMPLETED', 'CLOSED', 'CANCELLED')
);