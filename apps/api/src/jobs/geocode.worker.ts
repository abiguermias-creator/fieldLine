import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { config } from "../lib/config.js";
import { logger } from "../lib/logger.js";
import { geocodeSite } from "../geocode/geocode.service.js";
import { deadLetterQueue } from "./dlq.queue.js";

if (!config.REDIS_URL) {
  throw new Error("REDIS_URL is required for the geocode worker");
}

const connection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const geocodeWorker = new Worker(
  "geocode",
  async (job) => {
    const { siteId } = job.data as { siteId: string };

    logger.info({ jobId: job.id, siteId }, "Processing geocode job");

    await geocodeSite(siteId);

    logger.info({ jobId: job.id, siteId }, "Geocode job completed");
  },
  {
    connection,
  },
);

geocodeWorker.on("failed", async (job, error) => {
  logger.error(
    { jobId: job?.id, error },
    "Geocode job failed",
  );

  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await deadLetterQueue.add("geocode-dead-letter", {
      originalJobId: job.id,
      originalJobName: job.name,
      data: job.data,
      error: error.message,
      failedAt: new Date().toISOString(),
    });

    logger.error(
      { jobId: job.id },
      "Geocode job moved to dead-letter queue",
    );
  }
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down geocode worker");

  await geocodeWorker.close();
  await connection.quit();

  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));