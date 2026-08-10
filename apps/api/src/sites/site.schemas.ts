import { z } from "zod";

export const createSiteSchema = z.object({
  clientId: z.string().uuid(),

  name: z.string()
    .min(2)
    .max(100),

  address: z.string()
    .min(1, "Address is required"),

  city: z.string()
    .min(2)
    .max(100),

  accessNotes: z.string()
    .optional(),
});


export const updateSiteSchema =
  createSiteSchema.partial();


export const siteIdSchema = z.object({
  id: z.string().uuid(),
});
export const siteLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});