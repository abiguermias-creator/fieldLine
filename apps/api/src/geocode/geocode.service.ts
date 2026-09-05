import { prisma } from "../db/client.js";
import { logger } from "../lib/logger.js";
import { config } from "../lib/config.js";
import { resilientFetch } from "../integrations/httpClient.js";
import { getOrSetCache } from "../lib/cache.js";

type GeocodeResult = {
  latitude: number;
  longitude: number;
};

export async function geocodeAddress(
  address: string,
  city?: string,
): Promise<GeocodeResult | null> {
  const normalizedAddress = address.trim();
  const normalizedCity = city?.trim() || null;
  const cacheKey = `geocode:${normalizedCity ?? ""}:${normalizedAddress}`;

return getOrSetCache(cacheKey, 7 * 24 * 60 * 60, async () => {


  const cached = normalizedCity
    ? await prisma.geocodeCache.findUnique({
        where: {
          address_city: {
            address: normalizedAddress,
            city: normalizedCity,
          },
        },
      })
    : null;

  if (cached && cached.latitude !== null && cached.longitude !== null) {
    logger.info(
  { address: normalizedAddress, city: normalizedCity },
  "Using cached geocode",
);

    return {
      latitude: cached.latitude,
      longitude: cached.longitude,
    };
  }

  const query = normalizedCity ? `${normalizedAddress}, ${normalizedCity}` : normalizedAddress;

  try {
    const data = await resilientFetch<
  Array<{
    lat: string;
    lon: string;
  }>
>(
  `${config.NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}`,
  {
    timeoutMs: 3000,
    maxRetries: 1,
    headers: {
      "User-Agent": config.NOMINATIM_USER_AGENT,
    },
  },
);

    if (!data.length) {
      return null;
    }

    const firstResult = data[0];

    if (!firstResult) {
      return null;
    }

    const result: GeocodeResult = {
      latitude: Number(firstResult.lat),
      longitude: Number(firstResult.lon),
    };


    await prisma.geocodeCache.create({
      data: {
        address: normalizedAddress,
        city: normalizedCity,
        latitude: result.latitude,
        longitude: result.longitude,
      },
    });

    logger.info(
  { address: normalizedAddress, city: normalizedCity },
  "Geocoded and cached",
);

    return result;
  } catch (error) {
    logger.error({ error }, "Geocoding failed");

    return null;
  }
});
}
export async function geocodeSite(siteId: string) {
  const site = await prisma.site.findUnique({
    where: {
      id: siteId,
    },
  });

  if (!site) {
    return;
  }


  if (site.coordinatesManual) {
    logger.info({ siteId: site.id }, "Skipping geocode because site has manual coordinates");

    return;
  }

  const result = await geocodeAddress(site.address, site.city ?? undefined);

  if (!result) {
    logger.warn({ siteId: site.id }, "Could not geocode site");

    await prisma.site.update({
      where: {
        id: site.id,
      },
      data: {
        needsManualPlacement: true,
      },
    });

    return;
  }

  await prisma.site.update({
    where: {
      id: site.id,
    },
    data: {
      latitude: result.latitude,
      longitude: result.longitude,
      needsManualPlacement: false,
    },
  });

  logger.info({ siteId: site.id }, "Geocoded site");
}
