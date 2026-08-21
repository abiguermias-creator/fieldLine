import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientIdSchema = z.object({
  id: z.string().uuid(),
});

export const listClientsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be a whole number")
    .min(1, "Page must be greater than 0")
    .default(1),

  search: z.string().optional().default(""),
});
