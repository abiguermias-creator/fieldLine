import { redis } from "./redis.js";
import { logger } from "./logger.js";

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  if (!redis) {
  return fetchFn();
}

try {
  const cached = await redis.get(key);

  if (cached) {
    logger.info({ key }, "Redis cache hit");
    return JSON.parse(cached) as T;
  }
} catch (err) {
  logger.warn({ key, err }, "Redis cache get failed, proceeding to source");
}

const result = await fetchFn();

  if (redis && result !== undefined && result !== null) {
    try {
      await redis.set(key, JSON.stringify(result), "EX", ttlSeconds);
    } catch (err) {
      logger.warn({ key, err }, "Redis cache set failed");
    }
  }

  return result;
}
