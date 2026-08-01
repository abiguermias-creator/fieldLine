import { PrismaClient } from "@prisma/client";
import { config } from "../lib/config.js";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      config.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["warn", "error"],
  });

if (config.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}