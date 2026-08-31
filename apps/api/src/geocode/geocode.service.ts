import { prisma } from "../db/client.js";
import { logger } from "../lib/logger.js";

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

  // Check cache first
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
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "FieldLine-App/1.0",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Array<{
      lat: string;
      lon: string;
    }>;

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

    // Save successful result in cache
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

  // Never overwrite manually placed coordinates
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