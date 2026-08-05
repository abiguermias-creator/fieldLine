import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10, "Password must be at least 10 characters long."),
  fullName: z.string().min(2),
  role: z
    .enum([
      "CLIENT",
      "TECHNICIAN",
      "DISPATCHER",
      "SUPERVISOR",
    ])
    .default("CLIENT"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;