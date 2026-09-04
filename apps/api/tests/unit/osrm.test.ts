import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateStraightLineTravel,
  getTravelTime,
} from "../../src/integrations/osrm.js";
import { resilientFetch } from "../../src/integrations/httpClient.js";

vi.mock("../../src/integrations/httpClient.js", () => ({
  resilientFetch: vi.fn(),
}));

const mockedResilientFetch = vi.mocked(resilientFetch);

describe("OSRM integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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