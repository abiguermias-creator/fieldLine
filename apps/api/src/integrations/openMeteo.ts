import { config } from "../lib/config.js";
import { resilientFetch } from "./httpClient.js";

export interface OpenMeteoHourlyForecast {
  time?: string[];
  precipitation_probability?: number[];
  precipitation?: number[];
  wind_speed_10m?: number[];
}

interface WeatherResponse {
  hourly?: OpenMeteoHourlyForecast;
}

export async function getOpenMeteoForecast(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
): Promise<OpenMeteoHourlyForecast> {
  const url =
    `${config.OPEN_METEO_BASE_URL}/v1/forecast` +
    `?latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}` +
    `&hourly=precipitation_probability,precipitation,wind_speed_10m` +
    `&start_date=${startDate}` +
    `&end_date=${endDate}` +
    `&timezone=auto`;

  const data = await resilientFetch<WeatherResponse>(url, {
    timeoutMs: 2000,
    maxRetries: 1,
  });

  return data.hourly ?? {};
}

export interface WeatherWarning {
  hasWarning: boolean;
  reason?: string;
}

export async function checkWeatherAdvisory(
  latitude: number,
  longitude: number,
  targetTime: Date,
): Promise<WeatherWarning> {
  const date = targetTime.toISOString().slice(0, 10);

  try {
    const hourly = await getOpenMeteoForecast(
      latitude,
      longitude,
      date,
      date,
    );

    if (!hourly.time) {
      return { hasWarning: false };
    }

    const targetHour = targetTime.toISOString().slice(0, 13) + ":00";
    const hourIndex = hourly.time.indexOf(targetHour);

    if (hourIndex === -1) {
      return { hasWarning: false };
    }

    const precipitation =
      hourly.precipitation?.[hourIndex] ?? 0;

    const windSpeed =
      hourly.wind_speed_10m?.[hourIndex] ?? 0;

    if (precipitation > 5) {
      return {
        hasWarning: true,
        reason: `Heavy rain forecast (${precipitation} mm/h)`,
      };
    }

    if (windSpeed > 40) {
      return {
        hasWarning: true,
        reason: `High winds forecast (${windSpeed} km/h)`,
      };
    }

    return { hasWarning: false };
  } catch {

    return { hasWarning: false };
  }
}