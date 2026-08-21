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

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${encodeURIComponent(latitude)}` +
      `&longitude=${encodeURIComponent(longitude)}` +
      `&hourly=precipitation_probability,precipitation,windspeed_10m` +
      `&start_date=${start}` +
      `&end_date=${end}` +
      `&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      hourly?: {
        time?: string[];
        precipitation_probability?: number[];
        precipitation?: number[];
        windspeed_10m?: number[];
      };
    };

    const times = data.hourly?.time ?? [];
    const rainProbabilities =
      data.hourly?.precipitation_probability ?? [];
    const precipitation =
      data.hourly?.precipitation ?? [];
    const windSpeeds =
      data.hourly?.windspeed_10m ?? [];

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
    console.error(
      "Weather forecast unavailable:",
      error,
    );

    return null;
  }
}