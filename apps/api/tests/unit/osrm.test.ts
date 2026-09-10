import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateStraightLineTravel,
  getTravelTime,
} from "../../src/integrations/osrm.js";
import { resilientFetch } from "../../src/integrations/httpClient.js";
import { getOrSetCache } from "../../src/lib/cache.js";

vi.mock("../../src/integrations/httpClient.js", () => ({
  resilientFetch: vi.fn(),
}));

vi.mock("../../src/lib/cache.js", () => ({
  getOrSetCache: vi.fn(),
}));

const mockedResilientFetch = vi.mocked(resilientFetch);
const mockedGetOrSetCache = vi.mocked(getOrSetCache);

describe("OSRM integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const cache = new Map<string, unknown>();

    mockedGetOrSetCache.mockImplementation(
      async <T>(
        key: string,
        _ttlSeconds: number,
        fetchFn: () => Promise<T>,
      ): Promise<T> => {
        if (cache.has(key)) {
          return cache.get(key) as T;
        }

        const result = await fetchFn();
        cache.set(key, result);
        return result;
      },
    );
  });

  it("returns live routing result when OSRM succeeds", async () => {
    mockedResilientFetch.mockResolvedValue({
      code: "Ok",
      routes: [
        {
          duration: 15 * 60,
          distance: 12 * 1000,
        },
      ],
    });

    const result = await getTravelTime(
      9.03,
      38.74,
      9.05,
      38.76,
    );

    expect(result).toEqual({
      minutes: 15,
      distanceKm: 12,
      source: "routing",
    });

    expect(mockedResilientFetch).toHaveBeenCalledTimes(1);
  });

  it("uses the cached routing result for repeated requests", async () => {
    mockedResilientFetch.mockResolvedValue({
      code: "Ok",
      routes: [
        {
          duration: 15 * 60,
          distance: 12 * 1000,
        },
      ],
    });

    const firstResult = await getTravelTime(
      9.03,
      38.74,
      9.05,
      38.76,
    );

    const secondResult = await getTravelTime(
      9.03,
      38.74,
      9.05,
      38.76,
    );

    expect(firstResult).toEqual(secondResult);
    expect(firstResult.source).toBe("routing");
    expect(mockedResilientFetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to straight-line travel when OSRM times out", async () => {
    mockedResilientFetch.mockRejectedValue(
      new Error("The operation was aborted"),
    );

    const result = await getTravelTime(
      9.03,
      38.74,
      9.05,
      38.76,
    );

    const expectedFallback = calculateStraightLineTravel(
      9.03,
      38.74,
      9.05,
      38.76,
    );

    expect(result).toEqual(expectedFallback);
    expect(result.source).toBe("straight-line");
    expect(result.minutes).toBeGreaterThan(0);

    expect(mockedResilientFetch).toHaveBeenCalledTimes(1);
  });
});