import { z } from "zod";

export const createWorkOrderSchema = z.object({
  clientId: z.string().uuid(),
  siteId: z.string().uuid(),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must not exceed 200 characters"),
  description: z.string().optional(),
  isOutdoor: z.boolean().optional(),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  agreedDate: z.string().datetime().nullable().optional(),
  duplicateConfirmed: z.boolean().optional(),
});

export const updateWorkOrderSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must not exceed 200 characters")
    .optional(),

  description: z.string().optional(),

  isOutdoor: z.boolean().optional(),

  status: z.enum([
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
  ]).optional(),

  priority: z.enum(["P1", "P2", "P3", "P4"]).optional(),

  estimatedDuration: z.number().int().positive().nullable().optional(),

  skillIds: z.array(z.string().uuid()).optional(),

  agreedDate: z.string().datetime().nullable().optional(),

  technicianId: z.string().uuid().nullable().optional(),

  equipmentId: z.string().uuid().nullable().optional(),

  scheduledAt: z.string().datetime().nullable().optional(),

  scheduledEndAt: z.string().datetime().nullable().optional(),

  overrideDailyHours: z.boolean().optional(),

overrideReason: z
  .string()
  .trim()
  .min(1, "Override reason is required")
  .max(1000, "Override reason must not exceed 1000 characters")
  .optional(),
});

export const cancelWorkOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Cancellation reason is required")
    .max(1000, "Cancellation reason must not exceed 1000 characters"),
});

export const unassignWorkOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Unassignment reason is required")
    .max(1000, "Unassignment reason must not exceed 1000 characters"),
});

export const listWorkOrderQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),

  limit: z.coerce.number().min(1).max(100).default(25),

  statuses: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
    ),

  priorities: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
    ),

  technicianId: z.string().uuid().optional(),

  clientId: z.string().uuid().optional(),

  search: z.string().trim().optional(),

  createdFrom: z.string().datetime().optional(),

  createdTo: z.string().datetime().optional(),

  sortBy: z.enum(["createdAt", "priority", "nearestSla"]).default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createClientRequestSchema = z.object({
  siteId: z.string().uuid(),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must not exceed 200 characters"),
  description: z.string().optional(),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  p1Confirmed: z.boolean().optional(),
  duplicateConfirmed: z.boolean().optional(),
  agreedDate: z.string().datetime().nullable().optional(),
});

export const createWorkLogSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, "Note is required")
    .max(2000, "Note must not exceed 2000 characters"),

  minutesSpent: z
    .number()
    .int("Minutes spent must be a whole number")
    .positive("Minutes spent must be greater than zero"),

  partsUsed: z
    .string()
    .trim()
    .max(2000, "Parts used must not exceed 2000 characters")
    .optional(),
});

export const waitingOnPartsSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Description of needed parts is required")
    .max(1000, "Description must not exceed 1000 characters"),
});
