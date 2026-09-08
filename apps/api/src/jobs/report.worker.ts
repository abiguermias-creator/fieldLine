import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { config } from "../lib/config.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../db/client.js";
import { writeFile } from "node:fs/promises";
import { deadLetterQueue } from "./dlq.queue.js";

if (!config.REDIS_URL) {
  throw new Error("REDIS_URL is required for the report worker");
}

const connection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const reportWorker = new Worker(
  "reports",
  async (job) => {
    logger.info({ jobId: job.id }, "Processing report job");

    const workOrders = await prisma.workOrder.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        reference: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    const header = "reference,title,status,priority,createdAt";
    const rows = workOrders.map((workOrder) =>
      [
        workOrder.reference,
        workOrder.title,
        workOrder.status,
        workOrder.priority,
        workOrder.createdAt.toISOString(),
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );

    const csv = [header, ...rows].join("\n");
    const outputPath = `report-${job.id}.csv`;

    await writeFile(outputPath, csv, "utf8");

    logger.info(
      { jobId: job.id, outputPath, rowCount: workOrders.length },
      "Report job completed",
    );

    return { outputPath, rowCount: workOrders.length };
  },
  {
    connection,
  },
);

reportWorker.on("failed", async (job, error) => {
  logger.error(
    { jobId: job?.id, error },
    "Report job failed",
  );

  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await deadLetterQueue.add("report-dead-letter", {
      originalJobId: job.id,
      originalJobName: job.name,
      data: job.data,
      error: error.message,
      failedAt: new Date().toISOString(),
    });

    logger.error(
      { jobId: job.id },
      "Report job moved to dead-letter queue",
    );
  }
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down report worker");

  await reportWorker.close();
  await connection.quit();
  await prisma.$disconnect();

  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));