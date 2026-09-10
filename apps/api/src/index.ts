import { createApp } from "./app.js";
import { config } from "./lib/config.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./db/client.js";

if (!config.REDIS_URL) {
  throw new Error("REDIS_URL is required for API startup");
}

const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, "API listening");
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    logger.info({ signal }, "Shutting down");

    server.close();

    await prisma.$disconnect();

    process.exit(0);
  });
}
