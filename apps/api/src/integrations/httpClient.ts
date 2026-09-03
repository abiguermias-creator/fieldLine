import { logger } from "../lib/logger.js";

export interface RequestOptions {
  timeoutMs?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

export async function resilientFetch<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 3000;
  const maxRetries = options.maxRetries ?? 2;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startTime = Date.now();

    try {
      attempt++;

      const response = await fetch(url, {
        headers: options.headers,
        signal: controller.signal,
      });

      const durationMs = Date.now() - startTime;

      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: Client request error`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Server error`);
      }

      logger.info(
        {
          url,
          attempt,
          durationMs,
          status: response.status,
        },
        "Outbound HTTP success",
      );

      clearTimeout(timer);

      return (await response.json()) as T;
    } catch (error: unknown) {
      clearTimeout(timer);

      if (error instanceof Error && error.name === "AbortError") {
  lastError = new Error(`Request timed out after ${timeoutMs}ms`);
} else {
  lastError =
    error instanceof Error
      ? error
      : new Error(String(error));
}

      const durationMs = Date.now() - startTime;

      logger.warn(
        {
          url,
          attempt,
          durationMs,
          error: lastError.message,
        },
        "Outbound HTTP attempt failed",
      );

      // Do not retry 4xx client errors.
      if (lastError.message.startsWith("HTTP 4")) {
        throw lastError;
      }

      if (attempt > maxRetries) {
        break;
      }

      const baseDelay = 200 * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 50;

      await new Promise((resolve) =>
        setTimeout(resolve, baseDelay + jitter),
      );
    }
  }

  throw new Error(
    `Outbound call failed after ${attempt} attempts: ${lastError?.message}`,
  );
}