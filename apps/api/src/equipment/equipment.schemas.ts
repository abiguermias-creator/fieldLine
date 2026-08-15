import { z } from "zod";

export const createEquipmentSchema = z.object({
  code: z
    .string()
    .min(1, "Equipment code is required")
    .max(50, "Equipment code is too long"),

  name: z
    .string()
    .min(2, "Equipment name must be at least 2 characters")
    .max(100, "Equipment name is too long"),

  category: z
    .string()
    .min(2, "Equipment category must be at least 2 characters")
    .max(100, "Equipment category is too long"),

  description: z.string().optional(),

  serialNumber: z.string().optional(),
});

export const updateEquipmentSchema = z.object({
  code: z
    .string()
    .min(1, "Equipment code is required")
    .max(50, "Equipment code is too long")
    .optional(),

  name: z
    .string()
    .min(2, "Equipment name must be at least 2 characters")
    .max(100, "Equipment name is too long")
    .optional(),

  category: z
    .string()
    .min(2, "Equipment category must be at least 2 characters")
    .max(100, "Equipment category is too long")
    .optional(),

  description: z.string().optional(),

  serialNumber: z.string().optional().nullable(),
});

export const equipmentIdSchema = z.object({
  id: z.string().uuid(),
});