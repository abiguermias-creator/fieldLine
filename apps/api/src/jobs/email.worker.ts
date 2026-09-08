import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { config } from "../lib/config.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../db/client.js";
import { emailProvider } from "../integrations/email.js";
import { deadLetterQueue } from "./dlq.queue.js";

if (!config.REDIS_URL) {
  throw new Error("REDIS_URL is required for the email worker");
}

const connection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

type EmailJobData = {
  idempotencyKey: string;
  to: string;
  subject: string;
  text: string;
};

export const emailWorker = new Worker(
  "email-deliveries",
  async (job) => {
    const data = job.data as EmailJobData;

    logger.info(
      { jobId: job.id, idempotencyKey: data.idempotencyKey },
      "Processing email job",
    );

    const existing = await prisma.emailDelivery.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });

    if (existing?.status === "SENT") {
      logger.info(
        { jobId: job.id, idempotencyKey: data.idempotencyKey },
        "Email already sent, skipping duplicate job",
      );
      return;
    }

    const delivery = await prisma.emailDelivery.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      create: {
        idempotencyKey: data.idempotencyKey,
        to: data.to,
        subject: data.subject,
        status: "PENDING",
      },
      update: {
        status: "PENDING",
      },
    });

    try {
      const result = await emailProvider.send({
        to: data.to,
        subject: data.subject,
        text: data.text,
      });

      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SENT",
          provider: result.provider,
          sentAt: new Date(),
        },
      });

      logger.info(
        { jobId: job.id, deliveryId: delivery.id },
        "Email job completed",
      );
    } catch (error) {
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
        },
      });

      logger.error(
        { jobId: job.id, deliveryId: delivery.id, error },
        "Email job failed",
      );

      throw error;
    }
  },
    {
    connection,
    concurrency: 5,
  },
);

emailWorker.on("failed", async (job, error) => {
  logger.error(
    { jobId: job?.id, error },
    "Email worker job failed",
  );

  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await deadLetterQueue.add("email-dead-letter", {
      originalJobId: job.id,
      originalJobName: job.name,
      data: job.data,
      error: error.message,
      failedAt: new Date().toISOString(),
    });

    logger.error(
      { jobId: job.id },
      "Email job moved to dead-letter queue",
    );
  }
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down email worker");

  await emailWorker.close();
  await connection.quit();
  await prisma.$disconnect();

  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));