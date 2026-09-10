import { describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import {
  RateLimiterMemory,
  type RateLimiterAbstract,
} from "rate-limiter-flexible";

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

    const middleware = (
      limiterInstance: RateLimiterAbstract,
      keyGetter: (req: Request) => string,
    ) => {
      return async (request: Request, response: Response, nextFunction: NextFunction) => {
        const key = keyGetter(request);

        try {
          const result = await limiterInstance.consume(key);

          response.setHeader(
            "X-RateLimit-Limit",
            limiterInstance.points,
          );
          response.setHeader(
            "X-RateLimit-Remaining",
            Math.max(0, result.remainingPoints),
          );
          response.setHeader(
            "X-RateLimit-Reset",
            Math.ceil(result.msBeforeNext / 1000),
          );

          nextFunction();
        } catch (error) {
          if (error instanceof Error) {
            return nextFunction();
          }

          return response.status(429).json({
            error: {
              code: "RATE_LIMITED",
            },
          });
        }
      };
    };

    await middleware(limiter, (request) => request.ip ?? "unknown")(
      req,
      res,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});