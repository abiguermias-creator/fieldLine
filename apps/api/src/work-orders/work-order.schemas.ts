import { z } from "zod";

export const createWorkOrderSchema = z.object({
  clientId: z.string().uuid(),
  siteId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .optional(),
});

export const updateWorkOrderSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z
    .enum([
      "OPEN",
      "ASSIGNED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .optional(),
  technicianId: z.string().uuid().nullable().optional(),
  equipmentId: z.string().uuid().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export const listWorkOrderQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z
    .enum([
      "OPEN",
      "ASSIGNED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
  sort: z.enum(["createdAt", "priority"]).default("createdAt"),
});