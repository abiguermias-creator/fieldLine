ALTER TABLE "work_orders"
ADD CONSTRAINT "work_orders_no_equipment_double_booking"
EXCLUDE USING GIST (
  "equipment_id" WITH =,
  tstzrange("scheduled_at", "scheduled_end_at", '[)') WITH &&
)
WHERE (
  "equipment_id" IS NOT NULL
  AND "scheduled_at" IS NOT NULL
  AND "scheduled_end_at" IS NOT NULL
  AND "status" NOT IN ('COMPLETED', 'CLOSED', 'CANCELLED')
);
