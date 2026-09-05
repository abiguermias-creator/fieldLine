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
  '$argon2id$v=19$m=65536,t=3,p=4$Txe+3OWa6V4IiNxYCE0A8Q$FZlRNLbcNLhLB3ZX0cpG8EJBzosFIVMW3y3/p2jdzcg',
'System Migration',
'DISPATCHER',
false,
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;


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
