import { z } from "zod";

export const createTechnicianSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10, "Password must be at least 10 characters long."),
  fullName: z.string().min(2),
  employeeCode: z.string().min(1),
  baseLocation: z.string().min(1),
  maxWorkingMinutesPerDay: z.number().int().positive().default(480),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export const updateTechnicianSchema = z.object({
  fullName: z.string().min(2).optional(),
  employeeCode: z.string().min(1).optional(),
  baseLocation: z.string().min(1).optional(),
  maxWorkingMinutesPerDay: z.number().int().positive().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export const technicianIdSchema = z.object({
  id: z.string().uuid(),
});

export const listTechniciansQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional().default(""),
  skillId: z.string().uuid().optional(),
});
