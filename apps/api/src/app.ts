import cookieParser from "cookie-parser";
import authRoutes from "./auth/auth.routes.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { ulid } from "ulid";
import testRoutes from "./test/test.routes.js";
import protectedRoutes from "./auth/protected.routes.js";
import workOrderRoutes from "./work-orders/work-order.routes.js";
import clientRoutes from "./clients/client.routes.js";
import siteRoutes from "./sites/site.routes.js";
import skillsRoutes from "./skills/skills.routes.js";
import technicianRoutes from "./technicians/technician.routes.js";
import technicianSkillRoutes from "./technicians/technician-skill.routes.js";
import equipmentRoutes from "./equipment/equipment.routes.js";
import notificationRoutes from "./notifications/notification.routes.js";

import { config } from "./lib/config.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./db/client.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use(
    cors({
      origin: config.CORS_ORIGINS,
      credentials: true,
    }),
  );

  app.use(
    (pinoHttp as any)({
      logger,
      genReqId: () => ulid(),
    }),
  );

  const healthHandler = async (_req: express.Request, res: express.Response) => {
    let database = "ok";

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "unavailable";
    }

    res.json({
      status: database === "ok" ? "ok" : "degraded",
      database,
      time: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
    });
  };

  
  app.get("/api/health", healthHandler);

  
  app.get("/health", healthHandler);
  app.use("/api/auth", authRoutes);
  app.use("/api/test", testRoutes);
  app.use("/api/work-orders", workOrderRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/sites", siteRoutes);
  app.use("/api/skills", skillsRoutes);
  app.use("/api/technicians", technicianRoutes);
  app.use("/api/technicians", technicianSkillRoutes);
  app.use("/api/equipment", equipmentRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api", protectedRoutes);
  return app;
}
