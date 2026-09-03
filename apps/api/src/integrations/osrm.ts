import { config } from "../lib/config.js";
import { logger } from "../lib/logger.js";
import { resilientFetch } from "./httpClient.js";

interface OsrmResponse {
  code: string;
  routes?: {
    duration: number;
    distance: number;
  }[];
}

export interface TravelEstimateResult {
  minutes: number;
  distanceKm: number;
  source: "routing" | "straight-line";
}

export function calculateStraightLineTravel(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): TravelEstimateResult {
  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceKm = earthRadiusKm * c;
  const averageSpeedKmh = 30;

  const minutes = Math.max(
    1,
    Math.ceil((distanceKm / averageSpeedKmh) * 60),
  );

  return {
    minutes,
    distanceKm: Math.round(distanceKm * 10) / 10,
    source: "straight-line",
  };
}

export async function getTravelTime(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): Promise<TravelEstimateResult> {
  const osrmUrl =
    `${config.OSRM_BASE_URL}/route/v1/driving/` +
    `${lon1},${lat1};${lon2},${lat2}` +
    "?overview=false";

  try {
    const data = await resilientFetch<OsrmResponse>(
      osrmUrl,
      {
        timeoutMs: 2500,
        maxRetries: 1,
      },
    );

    if (data.code === "Ok" && data.routes?.[0]) {
      return {
        minutes: Math.max(
          1,
          Math.ceil(data.routes[0].duration / 60),
        ),
        distanceKm:
          Math.round(
            (data.routes[0].distance / 1000) * 10,
          ) / 10,
        source: "routing",
      };
    }
  } catch (error) {
    logger.warn(
      { error },
      "OSRM routing unavailable, using straight-line fallback",
    );
  }

  return calculateStraightLineTravel(
    lat1,
    lon1,
    lat2,
    lon2,
  );
}