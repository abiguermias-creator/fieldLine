import "dotenv/config";
import { z } from "zod";
import { logger } from "./logger.js";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_MINUTES: z.coerce.number().default(15),
  REFRESH_TOKEN_DAYS: z.coerce.number().default(14),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((s) => s.split(",").map((o) => o.trim())),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error(
  { errors: parsed.error.flatten().fieldErrors },
  "Invalid environment",
);
  process.exit(1);
}

export const config = parsed.data;
