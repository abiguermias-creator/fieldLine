import { Queue, type ConnectionOptions } from "bullmq";
import { redis } from "../lib/redis.js";

if (!redis) {
  throw new Error("REDIS_URL is required for background queues");
}

const connection: ConnectionOptions = {
  host: redis.options.host ?? "localhost",
  port: redis.options.port ?? 6379,
  password: redis.options.password,
};

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export const emailQueue = new Queue("email-deliveries", {
  connection,
  defaultJobOptions,
});

export const geocodeQueue = new Queue("geocode", {
  connection,
  defaultJobOptions,
});

export const reportQueue = new Queue("reports", {
  connection,
  defaultJobOptions,
});

export const deadLetterQueue = new Queue("dead-letter", {
  connection,
});