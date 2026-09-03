import { logger } from "../lib/logger.js";
import { getOpenMeteoForecast } from "../integrations/openMeteo.js";

type WeatherForecast = {
  available: true;
  location: {
    latitude: number;
    longitude: number;
  };
  window: {
    start: string;
    end: string;
  };
  summary: string;
  maxRainProbability: number;
  maxRainMm: number;
  maxWindKmh: number;
  warning: string | null;
};

const HEAVY_RAIN_MM = 10;
const HIGH_WIND_KMH = 50;

export async function getWeatherForecast(
  latitude: number | null,
  longitude: number | null,
  scheduledAt: Date | null,
  scheduledEndAt: Date | null,
): Promise<WeatherForecast | null> {
  if (
    latitude === null ||
    longitude === null ||
    scheduledAt === null ||
    scheduledEndAt === null
  ) {
    return null;
  }

  try {
    const start = scheduledAt.toISOString().slice(0, 10);
    const end = scheduledEndAt.toISOString().slice(0, 10);

    const hourly = await getOpenMeteoForecast(
      latitude,
      longitude,
      start,
      end,
    );

    const times = hourly.time ?? [];
    const rainProbabilities =
      hourly.precipitation_probability ?? [];
    const precipitation =
      hourly.precipitation ?? [];
    const windSpeeds =
      hourly.wind_speed_10m ?? [];

    const windowStart = scheduledAt.getTime();
    const windowEnd = scheduledEndAt.getTime();

    const indexes = times
      .map((time, index) => ({
        time: new Date(time).getTime(),
        index,
      }))
      .filter(
        ({ time }) =>
          time >= windowStart &&
          time <= windowEnd,
      )
      .map(({ index }) => index);

    if (indexes.length === 0) {
      return null;
    }

    const maxRainProbability = Math.max(
      ...indexes.map(
        (index) => rainProbabilities[index] ?? 0,
      ),
    );

    const maxRainMm = Math.max(
      ...indexes.map(
        (index) => precipitation[index] ?? 0,
      ),
    );

    const maxWindKmh = Math.max(
      ...indexes.map(
        (index) => windSpeeds[index] ?? 0,
      ),
    );

    const warnings: string[] = [];

    if (maxRainMm >= HEAVY_RAIN_MM) {
      warnings.push(
        `Heavy rain expected (${maxRainMm.toFixed(1)} mm)`,
      );
    }

    if (maxWindKmh >= HIGH_WIND_KMH) {
      warnings.push(
        `High wind expected (${Math.round(maxWindKmh)} km/h)`,
      );
    }

    return {
      available: true,

      location: {
        latitude,
        longitude,
      },

      window: {
        start: scheduledAt.toISOString(),
        end: scheduledEndAt.toISOString(),
      },

      summary:
        warnings.length > 0
          ? warnings.join("; ")
          : "No severe weather expected",

      maxRainProbability,
      maxRainMm,
      maxWindKmh,

      warning:
        warnings.length > 0
          ? warnings.join("; ")
          : null,
    };
  } catch (error) {
    logger.error(
      { error },
      "Weather forecast unavailable",
    );


    return null;
  }
}