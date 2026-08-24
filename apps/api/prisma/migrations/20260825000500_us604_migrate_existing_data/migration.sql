-- US-604: Migrate existing work-order data

-- Create a system actor for synthetic historical events.
INSERT INTO "users" (
  "id",
  "email",
  "password_hash",
  "full_name",
  "role",
  "is_active",
  "created_at",
  "updated_at"
)
VALUES (
  '00000000-0000-0000-0000-000000000604',
  'system-us604@fieldline.local',
  'SYSTEM',
  'System Migration',
  'DISPATCHER',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Create a synthetic creation event for every work order
-- that currently has no event history.
INSERT INTO "work_order_events" (
  "id",
  "work_order_id",
  "actor_id",
  "event_type",
  "old_value",
  "new_value",
  "created_at"
)
SELECT
  gen_random_uuid(),
  wo."id",
  '00000000-0000-0000-0000-000000000604',
  'WORK_ORDER_CREATED',
  NULL,
  wo."status"::text,
  wo."created_at"
FROM "work_orders" wo
WHERE NOT EXISTS (
  SELECT 1
  FROM "work_order_events" e
  WHERE e."work_order_id" = wo."id"
);

-- US-604 rollback:
-- DELETE FROM "work_order_events"
-- WHERE "actor_id" = '00000000-0000-0000-0000-000000000604';
--
-- DELETE FROM "users"
-- WHERE "id" = '00000000-0000-0000-0000-000000000604';
