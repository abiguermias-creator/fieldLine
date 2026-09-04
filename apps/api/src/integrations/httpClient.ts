import { logger } from "../lib/logger.js";

export interface RequestOptions {
  timeoutMs?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly retryAfterMs: number | null = null,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function parseRetryAfter(response: Response): number | null {
  const value = response.headers.get("Retry-After");

  if (!value) {
    return null;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const retryDate = Date.parse(value);

  if (!Number.isNaN(retryDate)) {
    return Math.max(0, retryDate - Date.now());
  }

  return null;
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

      if (response.status >= 400 && response.status < 500) {
        if (response.status !== 429) {
          throw new HttpError(
            response.status,
            null,
            `HTTP ${response.status}: Client request error`,
          );
        }

        throw new HttpError(
          response.status,
          parseRetryAfter(response),
          "HTTP 429: Too Many Requests",
        );
      }

      if (!response.ok) {
        throw new HttpError(
          response.status,
          null,
          `HTTP ${response.status}: Server error`,
        );
      }

      const data = (await response.json()) as T;

      logger.info(
        {
          url,
          attempt,
          durationMs: Date.now() - startTime,
          status: response.status,
        },
        "Outbound HTTP success",
      );

      return data;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error(`Request timed out after ${timeoutMs}ms`);
      } else {
        lastError =
          error instanceof Error
            ? error
            : new Error(String(error));
      }

      logger.warn(
        {
          url,
          attempt,
          durationMs: Date.now() - startTime,
          error: lastError.message,
        },
        "Outbound HTTP attempt failed",
      );

      if (lastError instanceof HttpError) {
        if (lastError.status >= 400 && lastError.status < 500) {
          if (lastError.status !== 429) {
            throw lastError;
          }
        }
      }

      if (attempt > maxRetries) {
        break;
      }

      const retryAfterMs =
        lastError instanceof HttpError
          ? lastError.retryAfterMs
          : null;

      const baseDelay = 200 * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 50;

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          retryAfterMs ?? baseDelay + jitter,
        ),
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(
    `Outbound call failed after ${attempt} attempts: ${lastError?.message}`,
  );
}