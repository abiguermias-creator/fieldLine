import { describe, expect, it, vi } from "vitest";

describe("Stage 5 background jobs", () => {
  it("allows queue module to be imported without REDIS_URL", async () => {
    vi.resetModules();

    vi.mock("../../src/lib/redis.js", () => ({
      redis: null,
    }));

    vi.mock("bullmq", () => ({
      Queue: vi.fn(),
    }));

    const queueModule = await import("../../src/jobs/queue.js");

    expect(queueModule.emailQueue).toBeDefined();
    expect(queueModule.geocodeQueue).toBeDefined();
    expect(queueModule.reportQueue).toBeDefined();
    expect(queueModule.deadLetterQueue).toBeDefined();
  });

  it("builds the assignment email idempotency key using the technician id", async () => {
    vi.resetModules();

    vi.mock("../../src/db/client.js", () => ({
      prisma: {},
    }));

    vi.mock("../../src/geocode/geocode.service.js", () => ({
      geocodeAddress: vi.fn(),
    }));

    vi.mock("../../src/notifications/notification.service.js", () => ({
      createNotification: vi.fn(),
    }));

    vi.mock("../../src/weather/weather.service.js", () => ({
      getWeatherForecast: vi.fn(),
    }));

    vi.mock("../../src/integrations/osrm.js", () => ({
      getTravelTime: vi.fn(),
    }));

    vi.mock("../../src/jobs/email.queue.js", () => ({
      emailQueue: {
        add: vi.fn(),
      },
    }));

    vi.mock("../../src/lib/config.js", () => ({
      config: {
        REDIS_URL: undefined,
        LOG_LEVEL: "info",
      },
    }));

    const { buildTechnicianAssignmentIdempotencyKey } =
      await import("../../src/work-orders/work-order.service.js");

    expect(
      buildTechnicianAssignmentIdempotencyKey(
        "work-order-123",
        "technician-456",
      ),
    ).toBe(
      "technician-assigned:work-order-123:technician-456",
    );
  });
});