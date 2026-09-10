import { Queue, type ConnectionOptions } from "bullmq";
import { redis } from "../lib/redis.js";

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
};

class LazyQueue {
  private queue: Queue | null = null;

  constructor(private readonly name: string) {}

  private getQueue(): Queue {
    if (!redis) {
      throw new Error("REDIS_URL is required for background queues");
    }

    if (!this.queue) {
      const connection: ConnectionOptions = {
        host: redis.options.host ?? "localhost",
        port: redis.options.port ?? 6379,
        password: redis.options.password,
      };

      this.queue = new Queue(this.name, {
        connection,
        defaultJobOptions,
      });
    }

    return this.queue;
  }

  add(
    name: string,
    data: Record<string, unknown>,
    options?: Parameters<Queue["add"]>[2],
  ) {
    return this.getQueue().add(name, data, options);
  }
}

export const emailQueue = new LazyQueue("email-deliveries");
export const geocodeQueue = new LazyQueue("geocode");
export const reportQueue = new LazyQueue("reports");
export const deadLetterQueue = new LazyQueue("dead-letter");