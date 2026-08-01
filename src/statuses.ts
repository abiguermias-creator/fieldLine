export const WORK_ORDER_STATUSES = [
  "NEW",
  "TRIAGED",
  "SCHEDULED",
  "ASSIGNED",
  "EN_ROUTE",
  "ON_SITE",
  "IN_PROGRESS",
  "ON_HOLD",
  "AWAITING_PARTS",
  "COMPLETED",
  "VERIFIED",
  "CLOSED",
  "CANCELLED",
] as const;

export type WorkOrderStatus =
  (typeof WORK_ORDER_STATUSES)[number];

export const TRANSITIONS: Record<
  WorkOrderStatus,
  readonly WorkOrderStatus[]
> = {
  NEW: ["TRIAGED", "CANCELLED"],
  TRIAGED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["EN_ROUTE", "SCHEDULED", "CANCELLED"],
  EN_ROUTE: ["ON_SITE", "ASSIGNED", "CANCELLED"],
  ON_SITE: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: [
    "ON_HOLD",
    "AWAITING_PARTS",
    "COMPLETED",
  ],
  ON_HOLD: [
    "IN_PROGRESS",
    "CANCELLED",
  ],
  AWAITING_PARTS: [
    "IN_PROGRESS",
    "CANCELLED",
  ],
  COMPLETED: [
    "VERIFIED",
    "IN_PROGRESS",
  ],
  VERIFIED: [
    "CLOSED",
  ],
  CLOSED: [],
  CANCELLED: [],
} as const;

export function canTransition(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}