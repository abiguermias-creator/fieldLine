import { z } from "zod";

export const addTechnicianSkillSchema = z.object({
  skillId: z.string().uuid(),
  certificationExpiresAt: z.string().datetime().nullable().optional(),
});

export const technicianSkillParamsSchema = z.object({
  technicianId: z.string().uuid(),
  skillId: z.string().uuid(),
});
