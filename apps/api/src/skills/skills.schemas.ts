import { z } from "zod";

export const createSkillSchema = z.object({
  code: z
    .string()
    .min(2, "Skill code must be at least 2 characters")
    .max(50, "Skill code is too long"),

  name: z
    .string()
    .min(2, "Skill name must be at least 2 characters")
    .max(100, "Skill name is too long"),
});

export const updateSkillSchema = z.object({
  code: z
    .string()
    .min(2, "Skill code must be at least 2 characters")
    .max(50, "Skill code is too long")
    .optional(),

  name: z
    .string()
    .min(2, "Skill name must be at least 2 characters")
    .max(100, "Skill name is too long")
    .optional(),
});