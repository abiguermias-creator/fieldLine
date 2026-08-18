-- Convert existing priority values before replacing the enum
ALTER TYPE "WorkOrderPriority" RENAME TO "WorkOrderPriority_old";

CREATE TYPE "WorkOrderPriority" AS ENUM ('P1', 'P2', 'P3', 'P4');

ALTER TABLE "work_orders"
  ALTER COLUMN "priority" DROP DEFAULT;

ALTER TABLE "work_orders"
  ALTER COLUMN "priority" TYPE "WorkOrderPriority"
  USING (
    CASE "priority"::text
      WHEN 'LOW' THEN 'P3'::"WorkOrderPriority"
      WHEN 'MEDIUM' THEN 'P2'::"WorkOrderPriority"
      WHEN 'HIGH' THEN 'P1'::"WorkOrderPriority"
      ELSE 'P3'::"WorkOrderPriority"
    END
  );

ALTER TABLE "work_orders"
  ALTER COLUMN "priority" SET DEFAULT 'P3';

DROP TYPE "WorkOrderPriority_old";


-- Convert existing status values before replacing the enum
ALTER TYPE "WorkOrderStatus" RENAME TO "WorkOrderStatus_old";

CREATE TYPE "WorkOrderStatus" AS ENUM (
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

ALTER TABLE "work_orders"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "work_orders"
  ALTER COLUMN "status" TYPE "WorkOrderStatus"
  USING (
    CASE "status"::text
      WHEN 'OPEN' THEN 'NEW'::"WorkOrderStatus"
      ELSE 'NEW'::"WorkOrderStatus"
    END
  );

ALTER TABLE "work_orders"
  ALTER COLUMN "status" SET DEFAULT 'NEW';

DROP TYPE "WorkOrderStatus_old";


-- Add references for existing and future work orders
ALTER TABLE "work_orders"
  ADD COLUMN "reference" TEXT;

WITH numbered_work_orders AS (
  SELECT
    "id",
    EXTRACT(YEAR FROM "created_at")::integer AS "year",
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM "created_at")
      ORDER BY "created_at", "id"
    ) AS "sequence"
  FROM "work_orders"
)
UPDATE "work_orders" AS wo
SET "reference" =
  'WO-' ||
  numbered_work_orders."year" ||
  '-' ||
  LPAD(numbered_work_orders."sequence"::text, 4, '0')
FROM numbered_work_orders
WHERE wo."id" = numbered_work_orders."id";

ALTER TABLE "work_orders"
  ALTER COLUMN "reference" SET NOT NULL;

CREATE UNIQUE INDEX "work_orders_reference_key"
  ON "work_orders"("reference");
