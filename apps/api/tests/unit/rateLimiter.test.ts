import { describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import {
  RateLimiterMemory,
  type RateLimiterAbstract,
} from "rate-limiter-flexible";
import { createRateLimitMiddleware } from "../../src/middleware/rateLimiter.js";

vi.mock("../../src/lib/redis.js", () => ({
  redis: null,
}));

vi.mock("../../src/lib/logger.js", () => ({
  logger: {
    error: vi.fn(),
  },
  child: vi.fn(),
}));

describe("rate limiter", () => {
  it("allows the request through when the limiter store throws an Error", async () => {
    const limiter: RateLimiterAbstract = new RateLimiterMemory({
      points: 5,
      duration: 60,
    });

    vi.spyOn(limiter, "consume").mockRejectedValue(
      new Error("Redis connection failed"),
    );

    const req = {
      ip: "127.0.0.1",
      id: "test-request",
    } as unknown as Request;

    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    const middleware = createRateLimitMiddleware(
      limiter,
      (request) => request.ip ?? "unknown",
    );

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});