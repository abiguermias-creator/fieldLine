import cookieParser from "cookie-parser";
import authRoutes from "./auth/auth.routes.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { ulid } from "ulid";
import testRoutes from "./test/test.routes.js";
import protectedRoutes from "./auth/protected.routes.js";

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
    })
  );

  app.use(
  (pinoHttp as any)({
    logger,
    genReqId: () => ulid(),
  })
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

  // For the web app (proxied through /api)
  app.get("/api/health", healthHandler);

  // For Render health checks
  app.get("/health", healthHandler);
  app.use("/api/auth", authRoutes);
  app.use("/api/test", testRoutes);
  app.use("/api", protectedRoutes);
  return app;
}