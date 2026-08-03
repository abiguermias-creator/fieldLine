import { z } from "zod";

export const createSiteSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(2).max(100),
  address: z.string().optional(),
});

export const updateSiteSchema = createSiteSchema.partial();

export const siteIdSchema = z.object({
  id: z.string().uuid(),
});