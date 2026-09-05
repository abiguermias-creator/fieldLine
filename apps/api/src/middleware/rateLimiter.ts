import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";
import {
  RateLimiterMemory,
  RateLimiterRedis,
  type RateLimiterAbstract,
} from "rate-limiter-flexible";
import { redis } from "../lib/redis.js";

const loginMemoryLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60,
});

const locationMemoryLimiter = new RateLimiterMemory({
  points: 4,
  duration: 60,
});

const loginLimiter: RateLimiterAbstract = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "rl:login",
      points: 5,
      duration: 15 * 60,
    })
  : loginMemoryLimiter;

const locationPingLimiter: RateLimiterAbstract = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "rl:pings",
      points: 4,
      duration: 60,
    })
  : locationMemoryLimiter;

function createRateLimitMiddleware(
  limiter: RateLimiterAbstract,
  keyGetter: (req: Request) => string,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGetter(req);

    try {
      const result = await limiter.consume(key);

      const limit = limiter.points;
      const remaining = Math.max(0, result.remainingPoints);
      const resetSeconds = Math.ceil(result.msBeforeNext / 1000);

      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", resetSeconds);

      next();
    } catch (rateLimitError) {
  const retryAfter = Math.max(
    1,
    Math.ceil(
      ((rateLimitError as { msBeforeNext?: number }).msBeforeNext ?? 0) / 1000,
    ),
  );

  res.setHeader("Retry-After", retryAfter);
  res.setHeader("X-RateLimit-Limit", limiter.points);
  res.setHeader("X-RateLimit-Remaining", 0);
  res.setHeader("X-RateLimit-Reset", retryAfter);

      return res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
          details: {
            retryAfterSeconds: retryAfter,
          },
          requestId: req.id,
        },
      });
    }
  };
}

export const loginRateLimiter = createRateLimitMiddleware(
  loginLimiter,
  (req) => req.ip ?? "unknown",
);

export const locationPingRateLimiter = createRateLimitMiddleware(
  locationPingLimiter,
  (req) => (req as AuthRequest).user?.userId ?? req.ip ?? "unknown",
);