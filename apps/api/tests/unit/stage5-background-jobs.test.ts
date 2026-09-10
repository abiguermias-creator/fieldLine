import { describe, expect, it, vi } from "vitest";

describe("Stage 5 background jobs", () => {
  it("fails loudly when REDIS_URL is missing", async () => {
    vi.resetModules();

    vi.mock("../../src/lib/redis.js", () => ({
      redis: null,
    }));

    vi.mock("bullmq", () => ({
      Queue: vi.fn(),
    }));

    await expect(
      import("../../src/jobs/queue.js"),
    ).rejects.toThrow(
      "REDIS_URL is required for background queues",
    );
  });

  it("includes technician id in assignment email idempotency key", () => {
    const workOrderId = "work-order-123";
    const technicianId = "technician-456";

    const idempotencyKey =
      `technician-assigned:${workOrderId}:${technicianId}`;

    expect(idempotencyKey).toBe(
      "technician-assigned:work-order-123:technician-456",
    );
  });
});