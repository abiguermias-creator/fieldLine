import { prisma } from "../db/client.js";
import { geocodeAddress } from "../geocode/geocode.service.js";
import { createNotification } from "../notifications/notification.service.js";
import { getWeatherForecast } from "../weather/weather.service.js";

type WorkOrderPriority = "P1" | "P2" | "P3" | "P4";

type WorkOrderStatus =
  | "NEW"
  | "TRIAGED"
  | "ASSIGNED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CLOSED"
  | "CANCELLED";

function calculateSlaTargets(
  priority: WorkOrderPriority,
  createdAt: Date,
  agreedDate?: Date | null,
) {
  let slaRespondBy: Date | null = null;
  let slaResolveBy: Date | null = null;

  switch (priority) {
    case "P1":
      slaRespondBy = new Date(
        createdAt.getTime() + 1 * 60 * 60 * 1000,
      );
      slaResolveBy = new Date(
        createdAt.getTime() + 4 * 60 * 60 * 1000,
      );
      break;

    case "P2":
      slaRespondBy = new Date(
        createdAt.getTime() + 4 * 60 * 60 * 1000,
      );
      slaResolveBy = new Date(
        createdAt.getTime() + 24 * 60 * 60 * 1000,
      );
      break;

    case "P3":
      slaRespondBy = new Date(
        createdAt.getTime() + 24 * 60 * 60 * 1000,
      );
      slaResolveBy = new Date(
        createdAt.getTime() + 5 * 24 * 60 * 60 * 1000,
      );
      break;

    case "P4":
      slaRespondBy = null;
      slaResolveBy = agreedDate ?? null;
      break;
  }

  return {
    slaRespondBy,
    slaResolveBy,
  };
}

function findSignificantWords(title: string) {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "is",
    "are",
    "to",
    "of",
    "for",
    "in",
    "on",
    "at",
    "with",
    "my",
    "our",
    "this",
    "that",
  ]);

  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length >= 3 && !stopWords.has(word),
    );
}

async function findPossibleDuplicate(
  siteId: string,
  title: string,
  excludeId?: string,
) {
  const twoHoursAgo = new Date(
    Date.now() - 2 * 60 * 60 * 1000,
  );

  const words = findSignificantWords(title);

  if (words.length === 0) {
    return null;
  }

  const recentOrders =
    await prisma.workOrder.findMany({
      where: {
        siteId,
        createdAt: {
          gte: twoHoursAgo,
        },
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
        ...(excludeId
          ? {
              id: {
                not: excludeId,
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        client: true,
        site: true,
      },
    });

  let bestMatch = null;
  let bestScore = 0;

  for (const order of recentOrders) {
    const existingWords = new Set(
      findSignificantWords(order.title),
    );

    const sharedWords = words.filter((word) =>
      existingWords.has(word),
    );

    const score =
      sharedWords.length /
      Math.max(words.length, existingWords.size);

    if (
      sharedWords.length >= 2 &&
      score >= 0.4 &&
      score > bestScore
    ) {
      bestScore = score;
      bestMatch = order;
    }
  }

  return bestMatch;
}

function calculateDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusKm = 6371;

  const lat1 = (latitude1 * Math.PI) / 180;
  const lat2 = (latitude2 * Math.PI) / 180;

  const deltaLat =
    ((latitude2 - latitude1) * Math.PI) / 180;

  const deltaLon =
    ((longitude2 - longitude1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

async function getRoutingTravelTime(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  try {
    const cachedRoute =
      await prisma.routingCache.findUnique({
        where: {
          fromLatitude_fromLongitude_toLatitude_toLongitude: {
            fromLatitude,
            fromLongitude,
            toLatitude,
            toLongitude,
          },
        },
      });

    if (cachedRoute) {
      return {
        minutes: cachedRoute.travelMinutes,
        distanceKm: cachedRoute.distanceKm,
      };
    }

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLongitude},${fromLatitude};` +
      `${toLongitude},${toLatitude}` +
      `?overview=false`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{
        duration?: number;
        distance?: number;
      }>;
    };

    const route = data.routes?.[0];

    if (
      data.code !== "Ok" ||
      !route ||
      typeof route.duration !== "number"
    ) {
      return null;
    }

    const minutes = Math.max(
      0,
      Math.round(route.duration / 60),
    );

    const distanceKm =
      typeof route.distance === "number"
        ? Math.round(
            (route.distance / 1000) * 10,
          ) / 10
        : null;

    await prisma.routingCache.upsert({
      where: {
        fromLatitude_fromLongitude_toLatitude_toLongitude: {
          fromLatitude,
          fromLongitude,
          toLatitude,
          toLongitude,
        },
      },
      update: {
        travelMinutes: minutes,
        distanceKm,
        source: "routing",
      },
      create: {
        fromLatitude,
        fromLongitude,
        toLatitude,
        toLongitude,
        travelMinutes: minutes,
        distanceKm,
        source: "routing",
      },
    });

    return {
      minutes,
      distanceKm,
    };
  } catch (error) {
    console.error(
      "Routing failed:",
      error,
    );

    return null;
  }
}

async function calculateTravelEstimate(
  baseLocation: string,
  siteLatitude: number | null,
  siteLongitude: number | null,
) {
  if (
    siteLatitude === null ||
    siteLongitude === null
  ) {
    return {
      estimatedTravelMinutes: null,
      travelDistanceKm: null,
      travelSource: "unavailable" as const,
    };
  }

  const baseCoordinates =
    await geocodeAddress(baseLocation);

  if (!baseCoordinates) {
    return {
      estimatedTravelMinutes: null,
      travelDistanceKm: null,
      travelSource: "unavailable" as const,
    };
  }

  const routingResult =
    await getRoutingTravelTime(
      baseCoordinates.latitude,
      baseCoordinates.longitude,
      siteLatitude,
      siteLongitude,
    );

  if (routingResult) {
    return {
      estimatedTravelMinutes:
        routingResult.minutes,
      travelDistanceKm:
        routingResult.distanceKm,
      travelSource: "routing" as const,
    };
  }

  const straightLineDistanceKm =
    calculateDistanceKm(
      baseCoordinates.latitude,
      baseCoordinates.longitude,
      siteLatitude,
      siteLongitude,
    );

  const averageDrivingSpeedKmh = 30;

  const fallbackMinutes = Math.max(
    1,
    Math.round(
      (straightLineDistanceKm /
        averageDrivingSpeedKmh) *
        60,
    ),
  );

  return {
    estimatedTravelMinutes: fallbackMinutes,
    travelDistanceKm:
      Math.round(
        straightLineDistanceKm * 10,
      ) / 10,
    travelSource: "straight-line-fallback" as const,
  };
}

export async function createWorkOrder(data: {
  clientId: string;
  siteId: string;
  title: string;
  description?: string;
  isOutdoor?: boolean;
  priority: WorkOrderPriority;
  agreedDate?: string | null;
  duplicateConfirmed?: boolean;
}) {
  const site = await prisma.site.findUnique({
    where: {
      id: data.siteId,
    },
    select: {
      id: true,
      clientId: true,
    },
  });

  if (!site) {
    throw new Error("Site not found");
  }

  if (site.clientId !== data.clientId) {
    throw new Error(
      "Site does not belong to the selected client",
    );
  }

  const possibleDuplicate =
    await findPossibleDuplicate(
      data.siteId,
      data.title,
    );

  if (
    possibleDuplicate &&
    data.duplicateConfirmed !== true
  ) {
    const duplicateError = new Error(
      "Possible duplicate work order found",
    );

    (
      duplicateError as Error & {
        code?: string;
        duplicate?: unknown;
      }
    ).code = "POSSIBLE_DUPLICATE";

    (
      duplicateError as Error & {
        code?: string;
        duplicate?: unknown;
      }
    ).duplicate = possibleDuplicate;

    throw duplicateError;
  }

  const createdAt = new Date();

  const agreedDate = data.agreedDate
    ? new Date(data.agreedDate)
    : null;

  const {
    slaRespondBy,
    slaResolveBy,
  } = calculateSlaTargets(
    data.priority,
    createdAt,
    agreedDate,
  );

  return prisma.$transaction(async (tx) => {
    const year = createdAt.getFullYear();

    const sequenceRow =
      await tx.workOrderSequence.upsert({
        where: {
          year,
        },
        create: {
          year,
          lastNumber: 1,
        },
        update: {
          lastNumber: {
            increment: 1,
          },
        },
      });

    const sequence = sequenceRow.lastNumber;

    const reference = `WO-${year}-${String(
      sequence,
    ).padStart(4, "0")}`;

    return tx.workOrder.create({
      data: {
        reference,
        clientId: data.clientId,
        siteId: data.siteId,
        title: data.title,
        description: data.description,
        isOutdoor: data.isOutdoor ?? false,
        priority: data.priority,
        status: "NEW",

        agreedDate,
        slaRespondBy,
        slaResolveBy,
      },
    });
  });
}

export async function getWorkOrders(query: {
  page: number;
  limit: number;
  statuses?: string[];
  priorities?: string[];
  technicianId?: string;
  clientId?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy: "createdAt" | "priority" | "nearestSla";
  sortOrder: "asc" | "desc";
}) {
  const where: any = {};

  if (
    query.statuses &&
    query.statuses.length > 0
  ) {
    where.status = {
      in: query.statuses,
    };
  }

  if (
    query.priorities &&
    query.priorities.length > 0
  ) {
    where.priority = {
      in: query.priorities,
    };
  }

  if (query.technicianId) {
    where.technicianId = query.technicianId;
  }

  if (query.clientId) {
    where.clientId = query.clientId;
  }

  if (query.search) {
    where.OR = [
      {
        reference: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        site: {
          name: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (
    query.createdFrom ||
    query.createdTo
  ) {
    where.createdAt = {};

    if (query.createdFrom) {
      where.createdAt.gte = new Date(
        query.createdFrom,
      );
    }

    if (query.createdTo) {
      where.createdAt.lte = new Date(
        query.createdTo,
      );
    }
  }

  const allItems =
    await prisma.workOrder.findMany({
      where,
      include: {
        client: true,
        site: true,
        technician: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
        equipment: true,
      },
    });

  const direction =
    query.sortOrder === "asc" ? 1 : -1;

  allItems.sort((a, b) => {
    if (query.sortBy === "createdAt") {
      return (
        (a.createdAt.getTime() -
          b.createdAt.getTime()) *
        direction
      );
    }

    if (query.sortBy === "priority") {
      const priorityRank: Record<
        "P1" | "P2" | "P3" | "P4",
        number
      > = {
        P1: 1,
        P2: 2,
        P3: 3,
        P4: 4,
      };

      return (
        (priorityRank[a.priority] -
          priorityRank[b.priority]) *
        direction
      );
    }

    const getNearestSla = (workOrder: {
      slaRespondBy: Date | null;
      slaResolveBy: Date | null;
    }) => {
      const targets = [
        workOrder.slaRespondBy,
        workOrder.slaResolveBy,
      ]
        .filter(
          (date): date is Date =>
            date !== null,
        )
        .map((date) => date.getTime());

      if (targets.length === 0) {
        return Number.MAX_SAFE_INTEGER;
      }

      return Math.min(...targets);
    };

    return (
      (getNearestSla(a) -
        getNearestSla(b)) *
      direction
    );
  });

  const total = allItems.length;

  const skip =
    (query.page - 1) * query.limit;

  const items = allItems.slice(
    skip,
    skip + query.limit,
  );

  return {
    items,
    pagination: {
      total,
      page: query.page,
      pageSize: query.limit,
      pages: Math.ceil(
        total / query.limit,
      ),
    },
  };
}

export async function getWorkOrderById(
  id: string,
) {
  return prisma.workOrder.findUnique({
    where: {
      id,
    },
    include: {
      client: true,
      site: true,
      technician: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              isActive: true,
            },
          },
        },
      },
      equipment: true,

      originalWorkOrder: {
        select: {
          id: true,
          reference: true,
          status: true,
        },
      },

      followUpWorkOrders: {
        select: {
          id: true,
          reference: true,
          status: true,
        },
      },

      workOrderSkills: {
        include: {
          skill: true,
        },
      },

      events: {
  orderBy: {
    createdAt: "asc",
  },
  include: {
    actor: {
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    },
  },
},
    },
  });
}

export async function updateWorkOrder(
  id: string,
  data: {
    title?: string;
    description?: string;
    isOutdoor?: boolean;
    status?: WorkOrderStatus;
    priority?: WorkOrderPriority;
    estimatedDuration?: number | null;
    skillIds?: string[];
    agreedDate?: string | null;
    technicianId?: string | null;
    equipmentId?: string | null;
    scheduledAt?: string | null;
    scheduledEndAt?: string | null;
    overrideDailyHours?: boolean;
    overrideReason?: string;
  },
  actorId: string,
) {
  const existingWorkOrder =
    await prisma.workOrder.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        siteId: true,
        title: true,
        description: true,
        isOutdoor: true,
        status: true,
        priority: true,
        estimatedDuration: true,
        createdAt: true,
        agreedDate: true,
        technicianId: true,
        equipmentId: true,
        scheduledAt: true,
        scheduledEndAt: true,
        workOrderSkills: {
          select: {
            skillId: true,
          },
        },
      },
    });

  if (!existingWorkOrder) {
    throw new Error(
      "Work order not found",
    );
  }

  if (
    existingWorkOrder.status === "CLOSED" ||
    existingWorkOrder.status === "CANCELLED"
  ) {
    throw new Error(
      "Closed or cancelled work orders cannot be edited",
    );
  }

  const schedulingRequested =
    data.scheduledAt !== undefined ||
    data.scheduledEndAt !== undefined;

  let nextScheduledAt =
    existingWorkOrder.scheduledAt;

  let nextScheduledEndAt =
    existingWorkOrder.scheduledEndAt;

  let schedulingWarning: string | null =
    null;

  if (schedulingRequested) {
    nextScheduledAt =
      data.scheduledAt !== undefined
        ? data.scheduledAt
          ? new Date(data.scheduledAt)
          : null
        : existingWorkOrder.scheduledAt;

    nextScheduledEndAt =
      data.scheduledEndAt !== undefined
        ? data.scheduledEndAt
          ? new Date(
              data.scheduledEndAt,
            )
          : null
        : existingWorkOrder.scheduledEndAt;

    const statusForScheduling =
  data.status ?? existingWorkOrder.status;

if (statusForScheduling !== "TRIAGED") {
  throw new Error(
    "Only TRIAGED work orders can be scheduled",
  );
}

    if (
      nextScheduledAt &&
      nextScheduledAt.getTime() <
        Date.now()
    ) {
      throw new Error(
        "SCHEDULE_IN_PAST",
      );
    }

    if (
      nextScheduledAt &&
      nextScheduledEndAt &&
      nextScheduledEndAt.getTime() <
        nextScheduledAt.getTime()
    ) {
      throw new Error(
        "Scheduled end must be after scheduled start",
      );
    }

    if (
      nextScheduledAt &&
      nextScheduledEndAt &&
      existingWorkOrder.estimatedDuration !==
        null
    ) {
      const windowDurationMinutes =
        (nextScheduledEndAt.getTime() -
          nextScheduledAt.getTime()) /
        (1000 * 60);

      if (
        windowDurationMinutes <
        existingWorkOrder.estimatedDuration
      ) {
        schedulingWarning =
          "SCHEDULED_WINDOW_SHORTER_THAN_ESTIMATED_DURATION";
      }
    }
  }

  const assigningTechnician =
  data.technicianId !== undefined &&
  data.technicianId !== null &&
  data.technicianId !== existingWorkOrder.technicianId;

const nextStatus =
  schedulingRequested &&
  nextScheduledAt &&
  nextScheduledEndAt
    ? "SCHEDULED"
    : data.status !== undefined
      ? data.status
      : assigningTechnician
        ? "ASSIGNED"
        : undefined;

  let assignedTechnicianName: string | null = null;
  let assignedTechnicianUserId: string | null = null;

  if (
    data.technicianId !== undefined && 
    data.technicianId !== null) 
    {
  const technician = 
  await prisma.technicianProfile.findUnique({
    where: {
      id: data.technicianId,
    },
    select: {
      id: true,
    user: {
    select: {
      id: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  },
},
});

  if (!technician) {
    throw new Error("Technician not found");
  }

  assignedTechnicianName = 
  technician.user.fullName;
  assignedTechnicianUserId = 
  technician.user.id;

  if (technician.user.role !== "TECHNICIAN") {
    throw new Error("Selected user is not a technician");
  }

  if (!technician.user.isActive) {
    throw new Error("Technician account is inactive");
  }
}

         if (
  data.technicianId !== undefined &&
  data.technicianId !== null &&
  nextScheduledAt &&
  nextScheduledEndAt
) {
  const requiredSkills =
    await prisma.workOrderSkill.findMany({
      where: {
        workOrderId: id,
      },
      select: {
        skillId: true,
        skill: {
          select: {
            code: true,
          },
        },
      },
    });

  if (requiredSkills.length > 0) {
    const technicianSkills =
      await prisma.technicianSkill.findMany({
        where: {
          technicianId: data.technicianId,
          skillId: {
            in: requiredSkills.map(
              (skill) => skill.skillId,
            ),
          },
        },
        select: {
          skillId: true,
          certificationExpiresAt: true,
        },
      });

    const technicianSkillMap = new Map(
      technicianSkills.map((skill) => [
        skill.skillId,
        skill,
      ]),
    );

    for (const requiredSkill of requiredSkills) {
      const technicianSkill =
        technicianSkillMap.get(requiredSkill.skillId);

      if (!technicianSkill) {
        throw new Error(
          `SKILL_NOT_HELD: Technician does not hold required skill ${requiredSkill.skill.code}`,
        );
      }

      if (
        technicianSkill.certificationExpiresAt &&
        technicianSkill.certificationExpiresAt <
          nextScheduledAt
      ) {
        throw new Error(
          `SKILL_EXPIRED: Certification for skill ${requiredSkill.skill.code} expired on ${technicianSkill.certificationExpiresAt.toISOString()}`,
        );
      }
    }
  }
}

  const nextPriority =
    data.priority ??
    existingWorkOrder.priority;

  const nextAgreedDate =
    data.agreedDate !== undefined
      ? data.agreedDate
        ? new Date(data.agreedDate)
        : null
      : existingWorkOrder.agreedDate;

  const shouldRecalculateSla =
    data.priority !== undefined ||
    data.agreedDate !== undefined;

  let slaRespondBy:
    | Date
    | null
    | undefined;

  let slaResolveBy:
    | Date
    | null
    | undefined;

  if (shouldRecalculateSla) {
    const targets =
      calculateSlaTargets(
        nextPriority,
        existingWorkOrder.createdAt,
        nextAgreedDate,
      );

    slaRespondBy =
      targets.slaRespondBy;

    slaResolveBy =
      targets.slaResolveBy;
  }

  const result = await prisma.$transaction(
    async (tx) => {

            const nextEquipmentId =
        data.equipmentId !== undefined
          ? data.equipmentId
          : existingWorkOrder.equipmentId;

      if (nextEquipmentId) {
        const equipment =
          await tx.equipment.findUnique({
            where: {
              id: nextEquipmentId,
            },
            select: {
              id: true,
              isActive: true,
            },
          });

        if (!equipment) {
          throw new Error("Equipment not found");
        }

        if (!equipment.isActive) {
          throw new Error(
            "EQUIPMENT_UNAVAILABLE: Selected equipment is inactive",
          );
        }

        if (
          nextScheduledAt &&
          nextScheduledEndAt
        ) {
          const conflictingWorkOrder =
            await tx.workOrder.findFirst({
              where: {
                equipmentId: nextEquipmentId,
                id: {
                  not: id,
                },
                status: {
                  notIn: [
                    "COMPLETED",
                    "CLOSED",
                    "CANCELLED",
                  ],
                },
                scheduledAt: {
                  not: null,
                },
                scheduledEndAt: {
                  not: null,
                },
                AND: [
                  {
                    scheduledAt: {
                      lt: nextScheduledEndAt,
                    },
                  },
                  {
                    scheduledEndAt: {
                      gt: nextScheduledAt,
                    },
                  },
                ],
              },
              select: {
  id: true,
  reference: true,
  scheduledAt: true,
  scheduledEndAt: true,
  site: {
    select: {
      latitude: true,
      longitude: true,
    },
  },
},
            });

          if (conflictingWorkOrder) {
            throw new Error(
              `EQUIPMENT_UNAVAILABLE: Equipment is already assigned to work order ${conflictingWorkOrder.reference} from ${conflictingWorkOrder.scheduledAt?.toISOString()} to ${conflictingWorkOrder.scheduledEndAt?.toISOString()}`,
            );
          }
        }
      }

      if (
  (data.technicianId ?? existingWorkOrder.technicianId) &&
  nextScheduledAt &&
  nextScheduledEndAt
) {
  const conflictingWorkOrder =
    await tx.workOrder.findFirst({
      where: {
        technicianId:
          data.technicianId ??
          existingWorkOrder.technicianId,
        id: {
          not: id,
        },
        status: {
          notIn: [
            "COMPLETED",
            "CLOSED",
            "CANCELLED",
          ],
        },
        scheduledAt: {
          not: null,
        },
        scheduledEndAt: {
          not: null,
        },
        AND: [
          {
            scheduledAt: {
              lt: nextScheduledEndAt,
            },
          },
          {
            scheduledEndAt: {
              gt: nextScheduledAt,
            },
          },
        ],
      },
      select: {
  id: true,
  reference: true,
  scheduledAt: true,
  scheduledEndAt: true,
  site: {
    select: {
      latitude: true,
      longitude: true,
    },
  },
},
    });

  if (conflictingWorkOrder) {
    throw new Error(
      `TECHNICIAN_UNAVAILABLE: Technician is already assigned to work order ${conflictingWorkOrder.reference} from ${conflictingWorkOrder.scheduledAt?.toISOString()} to ${conflictingWorkOrder.scheduledEndAt?.toISOString()}`,
    );
  }
  const previousWorkOrder =
  await tx.workOrder.findFirst({
    where: {
      technicianId:
        data.technicianId ??
        existingWorkOrder.technicianId,
      id: {
        not: id,
      },
      status: {
        notIn: [
          "COMPLETED",
          "CLOSED",
          "CANCELLED",
        ],
      },
      scheduledAt: {
        not: null,
        lt: nextScheduledAt,
      },
      scheduledEndAt: {
        not: null,
        lte: nextScheduledAt,
      },
    },
    orderBy: {
      scheduledEndAt: "desc",
    },
    select: {
      id: true,
      reference: true,
      scheduledAt: true,
      scheduledEndAt: true,
      site: {
        select: {
          latitude: true,
          longitude: true,
        },
      },
    },
  });

if (
  previousWorkOrder?.scheduledEndAt &&
  previousWorkOrder.site.latitude !== null &&
  previousWorkOrder.site.longitude !== null
) {
  const currentSite =
    await tx.site.findUnique({
      where: {
        id: existingWorkOrder.siteId,
      },
      select: {
        latitude: true,
        longitude: true,
      },
    });

  if (
    currentSite &&
    currentSite?.latitude !== null &&
    currentSite?.longitude !== null
  ) {
    const travel =
      await getRoutingTravelTime(
        previousWorkOrder.site.latitude,
        previousWorkOrder.site.longitude,
        currentSite.latitude,
        currentSite.longitude,
      );

    if (travel) {
      const availableTravelMinutes =
        Math.floor(
          (nextScheduledAt.getTime() -
            previousWorkOrder.scheduledEndAt.getTime()) /
            (1000 * 60),
        );

      if (
        travel.minutes >
        availableTravelMinutes
      ) {
        throw new Error(
          `INSUFFICIENT_TRAVEL_TIME: Required ${travel.minutes} minutes but only ${Math.max(
            0,
            availableTravelMinutes,
          )} minutes available between work order ${previousWorkOrder.reference} and this assignment`,
        );
      }
    }
  }
}
} 

      const nextTechnicianId =
        data.technicianId !== undefined
          ? data.technicianId
          : existingWorkOrder.technicianId;

      let dailyHoursOverrideUsed = false;

      if (
        nextTechnicianId &&
        nextScheduledAt &&
        nextScheduledEndAt
      ) {
        const technician =
          await tx.technicianProfile.findUnique({
            where: {
              id: nextTechnicianId,
            },
            select: {
              maxWorkingMinutesPerDay: true,
              user: {
                select: {
                  role: true,
                },
              },
            },
          });

        if (technician) {
          const dayStart = new Date(
            nextScheduledAt,
          );
          dayStart.setUTCHours(
            0,
            0,
            0,
            0,
          );

          const dayEnd = new Date(
            dayStart,
          );
          dayEnd.setUTCDate(
            dayEnd.getUTCDate() + 1,
          );

          const assignments =
            await tx.workOrder.findMany({
              where: {
                technicianId:
                  nextTechnicianId,
                id: {
                  not: id,
                },
                status: {
                  notIn: [
                    "COMPLETED",
                    "CLOSED",
                    "CANCELLED",
                  ],
                },
                scheduledAt: {
                  not: null,
                  lt: dayEnd,
                },
                scheduledEndAt: {
                  not: null,
                  gt: dayStart,
                },
              },
              select: {
                scheduledAt: true,
                scheduledEndAt: true,
                estimatedDuration: true,
              },
            });

          const assignedMinutesToday =
            assignments.reduce(
              (
                total,
                assignment,
              ) => {
                if (
                  !assignment.scheduledAt
                ) {
                  return total;
                }

                const assignmentStart =
                  Math.max(
                    assignment.scheduledAt.getTime(),
                    dayStart.getTime(),
                  );

                const assignmentEnd =
                  assignment.scheduledEndAt
                    ? Math.min(
                        assignment.scheduledEndAt.getTime(),
                        dayEnd.getTime(),
                      )
                    : Math.min(
                        assignment.scheduledAt.getTime() +
                          (assignment.estimatedDuration ??
                            0) *
                            60 *
                            1000,
                        dayEnd.getTime(),
                      );

                if (
                  assignmentEnd <=
                  assignmentStart
                ) {
                  return total;
                }

                return (
                  total +
                  (assignmentEnd -
                    assignmentStart) /
                    (1000 * 60)
                );
              },
              0,
            );

          const requestedMinutes =
            Math.max(
              0,
              (
                nextScheduledEndAt.getTime() -
                nextScheduledAt.getTime()
              ) /
                (1000 * 60),
            );

          const dailyLimit =
            technician.maxWorkingMinutesPerDay;

          const totalMinutes =
            assignedMinutesToday +
            requestedMinutes;

          if (
            totalMinutes >
            dailyLimit
          ) {
                        const actor =
              await tx.user.findUnique({
                where: {
                  id: actorId,
                },
                select: {
                  role: true,
                },
              });

            const isSupervisor =
              actor?.role ===
              "SUPERVISOR";

            if (
              data.overrideDailyHours ===
                true &&
              data.overrideReason?.trim() &&
              isSupervisor
            ) {
              dailyHoursOverrideUsed =
                true;
            } else if (
              data.overrideDailyHours ===
                true &&
              !isSupervisor
            ) {
              throw new Error(
                "DAILY_HOURS_OVERRIDE_REQUIRES_SUPERVISOR",
              );
            } else {
              throw new Error(
                `DAILY_HOURS_EXCEEDED: Current total is ${Math.round(
                  assignedMinutesToday,
                )} minutes and maximum is ${dailyLimit} minutes`,
              );
            }
          }
        }
      }

      const events: Array<{
        eventType: string;
        oldValue: string | null;
        newValue: string | null;
      }> = [];

      if (
        data.title !== undefined &&
        data.title !==
          existingWorkOrder.title
      ) {
        events.push({
          eventType: "FIELD_CHANGED",
          oldValue:
            existingWorkOrder.title,
          newValue: data.title,
        });
      }

      if (
        data.description !== undefined &&
        data.description !==
          existingWorkOrder.description
      ) {
        events.push({
          eventType: "FIELD_CHANGED",
          oldValue:
            existingWorkOrder.description,
          newValue:
            data.description,
        });
      }

      if (
        data.priority !== undefined &&
        data.priority !==
          existingWorkOrder.priority
      ) {
        events.push({
          eventType: "PRIORITY_CHANGED",
          oldValue:
            existingWorkOrder.priority,
          newValue: data.priority,
        });
      }

      if (
        data.estimatedDuration !==
          undefined &&
        data.estimatedDuration !==
          existingWorkOrder.estimatedDuration
      ) {
        events.push({
          eventType: "FIELD_CHANGED",
          oldValue:
            existingWorkOrder.estimatedDuration !==
            null
              ? String(
                  existingWorkOrder.estimatedDuration,
                )
              : null,
          newValue:
            data.estimatedDuration !==
            null
              ? String(
                  data.estimatedDuration,
                )
              : null,
        });
      }

     if (
  data.technicianId !== undefined &&
  data.technicianId !==
    existingWorkOrder.technicianId
) {
  events.push({
    eventType: "TECHNICIAN_ASSIGNED",
    oldValue:
      existingWorkOrder.technicianId,
    newValue:
      assignedTechnicianName,
  });
}

      if (
  data.equipmentId !== undefined &&
  data.equipmentId !==
    existingWorkOrder.equipmentId
) {
  events.push({
    eventType: "EQUIPMENT_ASSIGNED",
    oldValue:
      existingWorkOrder.equipmentId,
    newValue:
      data.equipmentId,
  });
}

      if (
        nextScheduledAt?.getTime() !==
        existingWorkOrder.scheduledAt?.getTime()
      ) {
        events.push({
          eventType: "FIELD_CHANGED",
          oldValue:
            existingWorkOrder.scheduledAt?.toISOString() ??
            null,
          newValue:
            nextScheduledAt?.toISOString() ??
            null,
        });
      }

      if (
        nextScheduledEndAt?.getTime() !==
        existingWorkOrder.scheduledEndAt?.getTime()
      ) {
        events.push({
          eventType: "FIELD_CHANGED",
          oldValue:
            existingWorkOrder.scheduledEndAt?.toISOString() ??
            null,
          newValue:
            nextScheduledEndAt?.toISOString() ??
            null,
        });
      }

      if (
        nextStatus !== undefined &&
        nextStatus !==
          existingWorkOrder.status
      ) {
        events.push({
          eventType: "STATUS_CHANGED",
          oldValue:
            existingWorkOrder.status,
          newValue: nextStatus,
        });
      }

      const workOrder =
        await tx.workOrder.update({
          where: {
            id,
          },

         data: {
  title: data.title,
  description: data.description,
  isOutdoor:
    data.isOutdoor !== undefined
      ? data.isOutdoor
      : undefined,

  status: nextStatus,

            priority: data.priority,
            estimatedDuration:
              data.estimatedDuration,

            agreedDate:
              data.agreedDate !== undefined
                ? nextAgreedDate
                : undefined,

            slaRespondBy,
            slaResolveBy,

            equipmentId:
              data.equipmentId,

            technicianId:
              data.technicianId,

            scheduledAt:
              nextScheduledAt,

            scheduledEndAt:
              nextScheduledEndAt,

                          dailyHoursOverride:
              dailyHoursOverrideUsed
                ? true
                : undefined,

            dailyHoursOverrideReason:
              dailyHoursOverrideUsed
                ? data.overrideReason!.trim()
                : undefined,

            dailyHoursOverrideRules:
              dailyHoursOverrideUsed
                ? "DAILY_HOURS_EXCEEDED"
                : undefined,
          },

          include: {
            client: true,
            site: true,
            technician: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    isActive: true,
                  },
                },
              },
            },
            equipment: true,
            workOrderSkills: {
              include: {
                skill: true,
              },
            },
          },
        });

      if (data.skillIds !== undefined) {
        const oldSkillIds =
          existingWorkOrder.workOrderSkills
            .map(
              (item) =>
                item.skillId,
            )
            .sort();

        const newSkillIds =
          [...data.skillIds].sort();

        const skillsChanged =
          JSON.stringify(
            oldSkillIds,
          ) !==
          JSON.stringify(
            newSkillIds,
          );

        if (skillsChanged) {
          await tx.workOrderSkill.deleteMany(
            {
              where: {
                workOrderId: id,
              },
            },
          );

          if (newSkillIds.length > 0) {
            await tx.workOrderSkill.createMany(
              {
                data: newSkillIds.map(
                  (skillId) => ({
                    workOrderId: id,
                    skillId,
                  }),
                ),
              },
            );
          }

          events.push({
            eventType:
              "SKILLS_CHANGED",
            oldValue:
              JSON.stringify(
                oldSkillIds,
              ),
            newValue:
              JSON.stringify(
                newSkillIds,
              ),
          });
        }
      }

      for (const event of events) {
        await tx.workOrderEvent.create({
          data: {
            workOrderId: id,
            actorId,
            eventType:
              event.eventType,
            oldValue:
              event.oldValue,
            newValue:
              event.newValue,
          },
        });
      }

            if (dailyHoursOverrideUsed) {
        await tx.workOrderEvent.create({
          data: {
            workOrderId: id,
            actorId,
            eventType:
              "DAILY_HOURS_OVERRIDE",
            oldValue:
              "DAILY_HOURS_EXCEEDED",
            newValue:
              JSON.stringify({
                reason:
                  data.overrideReason!.trim(),
                rulesBypassed:
                  ["DAILY_HOURS_EXCEEDED"],
              }),
          },
        });
      }

            return {
        ...workOrder,
        schedulingWarning,
      };
    },
    {
      timeout: 10000,
    },
  );

  if (
    assigningTechnician &&
    assignedTechnicianUserId &&
    assignedTechnicianName
  ) {
    await createNotification({
      userId: assignedTechnicianUserId,
      type: "TECHNICIAN_ASSIGNED",
      title: "Work order assigned",
      message: `You have been assigned work order ${result.reference}.`,
    });
  }

  return result;
}


export async function cancelWorkOrder(
  id: string,
  reason: string,
  actorId: string,
) {
  const existingWorkOrder =
    await prisma.workOrder.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        siteId: true,
        status: true,
        technicianId: true,
      },
    });

  if (!existingWorkOrder) {
    throw new Error(
      "Work order not found",
    );
  }

  if (
    existingWorkOrder.status ===
    "COMPLETED"
  ) {
    throw new Error(
      "Completed work orders cannot be cancelled",
    );
  }

  if (
    existingWorkOrder.status ===
      "CLOSED" ||
    existingWorkOrder.status ===
      "CANCELLED"
  ) {
    throw new Error(
      "Closed or cancelled work orders cannot be cancelled",
    );
  }

  return prisma.$transaction(
    async (tx) => {
      const workOrder =
        await tx.workOrder.update({
          where: {
            id,
          },
          data: {
            status: "CANCELLED",
            cancellationReason:
              reason,
            technicianId: null,
          },
          include: {
            client: true,
            site: true,
            technician: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    isActive: true,
                  },
                },
              },
            },
            equipment: true,
          },
        });

      await tx.workOrderEvent.create({
        data: {
          workOrderId: id,
          actorId,
          eventType:
            "WORK_ORDER_CANCELLED",
          oldValue:
            existingWorkOrder.status,
          newValue: reason,
        },
      });

      return workOrder;
    },
  );
}

export async function deleteWorkOrder(
  id: string,
) {
  return prisma.workOrder.delete({
    where: {
      id,
    },
  });
}

export async function createClientRequest(
  userId: string,
  data: {
    siteId: string;
    title: string;
    description?: string;
    priority: WorkOrderPriority;
    p1Confirmed?: boolean;
    duplicateConfirmed?: boolean;
    agreedDate?: string | null;
  },
) {
  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        clientId: true,
      },
    });

  if (!user) {
    throw new Error(
      "User not found",
    );
  }

  if (!user.clientId) {
    throw new Error(
      "Client company is not assigned to this user",
    );
  }

  if (
    data.priority === "P1" &&
    data.p1Confirmed !== true
  ) {
    throw new Error(
      "P1 requires confirmation before submission",
    );
  }

  const site =
    await prisma.site.findUnique({
      where: {
        id: data.siteId,
      },
      select: {
        id: true,
        clientId: true,
      },
    });

  if (!site) {
    throw new Error(
      "Site not found",
    );
  }

  if (
    site.clientId !==
    user.clientId
  ) {
    throw new Error(
      "You can only create requests for your company's sites",
    );
  }

  const possibleDuplicate =
    await findPossibleDuplicate(
      data.siteId,
      data.title,
    );

  if (
    possibleDuplicate &&
    data.duplicateConfirmed !== true
  ) {
    const duplicateError =
      new Error(
        "Possible duplicate work order found",
      );

    (
      duplicateError as Error & {
        code?: string;
        duplicate?: unknown;
      }
    ).code =
      "POSSIBLE_DUPLICATE";

    (
      duplicateError as Error & {
        code?: string;
        duplicate?: unknown;
      }
    ).duplicate =
      possibleDuplicate;

    throw duplicateError;
  }

  const createdAt = new Date();

  const agreedDate =
    data.agreedDate
      ? new Date(data.agreedDate)
      : null;

  const {
    slaRespondBy,
    slaResolveBy,
  } = calculateSlaTargets(
    data.priority,
    createdAt,
    agreedDate,
  );

  const result =
    await prisma.$transaction(
      async (tx) => {
        const year =
          createdAt.getFullYear();

        const sequenceRow =
          await tx.workOrderSequence.upsert(
            {
              where: {
                year,
              },
              create: {
                year,
                lastNumber: 1,
              },
              update: {
                lastNumber: {
                  increment: 1,
                },
              },
            },
          );

        const sequence =
          sequenceRow.lastNumber;

        const reference = `WO-${year}-${String(
          sequence,
        ).padStart(4, "0")}`;

        const workOrder =
          await tx.workOrder.create({
            data: {
              reference,
              clientId:
                user.clientId!,
              siteId:
                data.siteId,
              title:
                data.title,
              description:
                data.description,
              priority:
                data.priority,
              status: "NEW",

              agreedDate,
              slaRespondBy,
              slaResolveBy,
            },
          });

        return workOrder;
      },
    );

  return {
    reference:
      result.reference,
    responseTarget:
      result.slaRespondBy,
    workOrder: result,
  };
}

export async function createFollowUpWorkOrder(
  originalWorkOrderId: string,
) {
  const originalWorkOrder =
    await prisma.workOrder.findUnique({
      where: {
        id: originalWorkOrderId,
      },
      include: {
        workOrderSkills: {
          select: {
            skillId: true,
          },
        },
        followUpWorkOrders: {
          select: {
            id: true,
          },
        },
      },
    });

  if (!originalWorkOrder) {
    throw new Error(
      "Work order not found",
    );
  }

  if (
    originalWorkOrder.status !==
    "CLOSED"
  ) {
    throw new Error(
      "Only closed work orders can have a follow-up",
    );
  }

  if (
    originalWorkOrder.followUpWorkOrders
      .length > 0
  ) {
    throw new Error(
      "This work order already has a follow-up",
    );
  }

  const createdAt = new Date();

  return prisma.$transaction(
    async (tx) => {
      const year =
        createdAt.getFullYear();

      const sequenceRow =
        await tx.workOrderSequence.upsert(
          {
            where: {
              year,
            },
            create: {
              year,
              lastNumber: 1,
            },
            update: {
              lastNumber: {
                increment: 1,
              },
            },
          },
        );

      const sequence =
        sequenceRow.lastNumber;

      const reference = `WO-${year}-${String(
        sequence,
      ).padStart(4, "0")}`;

      const followUp =
        await tx.workOrder.create({
          data: {
            reference,
            clientId:
              originalWorkOrder.clientId,
            siteId:
              originalWorkOrder.siteId,

            title: `Follow-up: ${originalWorkOrder.title}`,
            description:
              originalWorkOrder.description,

            priority:
              originalWorkOrder.priority,
            status: "NEW",

            originalWorkOrderId:
              originalWorkOrder.id,

            workOrderSkills: {
              create:
                originalWorkOrder.workOrderSkills.map(
                  ({ skillId }) => ({
                    skillId,
                  }),
                ),
            },
          },

          include: {
            client: true,
            site: true,
            workOrderSkills: {
              include: {
                skill: true,
              },
            },
            originalWorkOrder: {
              select: {
                id: true,
                reference: true,
                status: true,
              },
            },
          },
        });

      return followUp;
    },
  );
}

export async function getAssignmentOptions(
  workOrderId: string,
) {
  const workOrder =
    await prisma.workOrder.findUnique({
      where: {
        id: workOrderId,
      },
      select: {
  id: true,
  estimatedDuration: true,
  scheduledAt: true,
  scheduledEndAt: true,
  isOutdoor: true,

        site: {
          select: {
            latitude: true,
            longitude: true,
            address: true,
            city: true,
          },
        },

        workOrderSkills: {
          select: {
            skillId: true,
            skill: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

  if (!workOrder) {
    throw new Error(
      "Work order not found",
    );
  }

  let weather = null;

if (
  workOrder.isOutdoor &&
  workOrder.scheduledAt &&
  workOrder.scheduledEndAt
) {
  weather = await getWeatherForecast(
    workOrder.site.latitude,
    workOrder.site.longitude,
    workOrder.scheduledAt,
    workOrder.scheduledEndAt,
  );
}

  const technicians =
    await prisma.technicianProfile.findMany(
      {
        where: {
          user: {
            role: "TECHNICIAN",
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              isActive: true,
            },
          },
          technicianSkills: {
            include: {
              skill: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    );

  const now = new Date();

const scheduleDate =
  workOrder.scheduledAt ?? now;

const startOfScheduleDay =
  new Date(scheduleDate);
startOfScheduleDay.setHours(
  0,
  0,
  0,
  0,
);

const endOfScheduleDay =
  new Date(scheduleDate);
endOfScheduleDay.setHours(
  23,
  59,
  59,
  999,
);

  const requiredSkillIds =
    workOrder.workOrderSkills.map(
      (item) => item.skillId,
    );

  const results = await Promise.all(
    technicians.map(
      async (technician) => {
        const todayAssignments =
          await prisma.workOrder.findMany(
            {
              where: {
                technicianId:
                  technician.id,
                scheduledAt: {
                  gte: startOfScheduleDay,
                  lte: endOfScheduleDay,
                },
                status: {
                  notIn: [
                    "COMPLETED",
                    "CANCELLED",
                  ],
                },
                id: {
                  not: workOrderId,
                },
              },
             select: {
  id: true,
  scheduledAt: true,
  scheduledEndAt: true,
  estimatedDuration: true,
  site: {
    select: {
      latitude: true,
      longitude: true,
    },
  },
},
});

        const assignedMinutesToday =
          todayAssignments.reduce(
            (
              total,
              assignment,
            ) => {
              if (
                assignment.scheduledAt &&
                assignment.scheduledEndAt
              ) {
                const duration =
                  (assignment.scheduledEndAt.getTime() -
                    assignment.scheduledAt.getTime()) /
                  (1000 * 60);

                return (
                  total +
                  Math.max(
                    0,
                    duration,
                  )
                );
              }

              return (
                total +
                (assignment.estimatedDuration ??
                  0)
              );
            },
            0,
          );

        const technicianSkillMap =
          new Map(
            technician.technicianSkills.map(
              (item) => [
                item.skillId,
                item,
              ],
            ),
          );

        const missingSkills =
          requiredSkillIds
            .filter(
              (skillId) =>
                !technicianSkillMap.has(
                  skillId,
                ),
            )
            .map(
              (skillId) => {
                const requiredSkill =
                  workOrder.workOrderSkills.find(
                    (item) =>
                      item.skillId ===
                      skillId,
                  );

                return (
                  requiredSkill
                    ?.skill.name ||
                  "Required skill"
                );
              },
            );

        const expiredSkills =
          workOrder.workOrderSkills
            .filter((item) => {
              const technicianSkill =
                technicianSkillMap.get(
                  item.skillId,
                );

              if (!technicianSkill) {
                return false;
              }

              return (
                technicianSkill.certificationExpiresAt !==
                  null &&
                technicianSkill.certificationExpiresAt <
                  now
              );
            })
            .map(
              (item) =>
                item.skill.name,
            );

        const hasRequiredSkills =
          missingSkills.length === 0 &&
          expiredSkills.length === 0;

        const durationNeeded =
          workOrder.estimatedDuration ??
          0;

        const wouldExceedDailyLimit =
          assignedMinutesToday +
            durationNeeded >
          technician.maxWorkingMinutesPerDay;

        let hasScheduleConflict =
          false;

        if (workOrder.scheduledAt) {
          const requestedStart =
            workOrder.scheduledAt.getTime();

          const requestedEnd =
            workOrder.scheduledEndAt?.getTime() ??
            requestedStart +
              durationNeeded *
                60 *
                1000;

          hasScheduleConflict =
            todayAssignments.some(
              (assignment) => {
                if (
                  !assignment.scheduledAt
                ) {
                  return false;
                }

                const assignmentStart =
                  assignment.scheduledAt.getTime();

                const assignmentEnd =
                  assignment.scheduledEndAt?.getTime() ??
                  assignmentStart +
                    (assignment.estimatedDuration ??
                      0) *
                      60 *
                      1000;

                return (
                  requestedStart <
                    assignmentEnd &&
                  requestedEnd >
                    assignmentStart
                );
              },
            );
        }

        let reason: string | null =
          null;

        if (
          !technician.user.isActive
        ) {
          reason =
            "Technician account is inactive";
        } else if (
          missingSkills.length > 0
        ) {
          reason = `Missing required skill: ${missingSkills.join(
            ", ",
          )}`;
        } else if (
          expiredSkills.length > 0
        ) {
          reason = `Certification expired: ${expiredSkills.join(
            ", ",
          )}`;
        } else if (
          wouldExceedDailyLimit
        ) {
          reason = `Daily limit exceeded (${Math.round(
            assignedMinutesToday,
          )}/${technician.maxWorkingMinutesPerDay} minutes assigned)`;
        } else if (
          hasScheduleConflict
        ) {
          reason =
            "Already assigned to another job at this time";
        }

      
        const travel =
          await calculateTravelEstimate(
            technician.baseLocation,
            workOrder.site.latitude,
            workOrder.site.longitude,
          );

        return {
          id: technician.id,
          employeeCode:
            technician.employeeCode,
          name:
            technician.user.fullName,
          email:
            technician.user.email,
          baseLocation:
            technician.baseLocation,

          assignedMinutesToday:
            Math.round(
              assignedMinutesToday,
            ),

          maxWorkingMinutesPerDay:
            technician.maxWorkingMinutesPerDay,

          remainingMinutesToday:
            Math.max(
              0,
              technician.maxWorkingMinutesPerDay -
                Math.round(
                  assignedMinutesToday,
                ),
            ),

          hasRequiredSkills,

          skills:
            technician.technicianSkills.map(
              (item) => ({
                id: item.skill.id,
                code: item.skill.code,
                name: item.skill.name,
                certificationExpiresAt:
                  item.certificationExpiresAt,
              }),
            ),

          missingSkills,
          expiredSkills,

          available:
            reason === null,

          reason,

          estimatedTravelMinutes:
            travel.estimatedTravelMinutes,

          travelDistanceKm:
            travel.travelDistanceKm,

          travelSource:
            travel.travelSource,
        };
      },
    ),
  );

    const equipment =
    await prisma.equipment.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

  const equipmentResults =
    await Promise.all(
      equipment.map(
        async (item) => {
          const assignments =
            await prisma.workOrder.findMany({
              where: {
                equipmentId: item.id,
                status: {
                  notIn: [
                    "COMPLETED",
                    "CANCELLED",
                  ],
                },
                id: {
                  not: workOrderId,
                },
                scheduledAt: {
                  not: null,
                },
              },
              select: {
                id: true,
                reference: true,
                scheduledAt: true,
                scheduledEndAt: true,
                estimatedDuration: true,
              },
            });

          let hasScheduleConflict = false;
          let conflictingWorkOrder = null;

          if (workOrder.scheduledAt) {
            const requestedStart =
              workOrder.scheduledAt.getTime();

            const requestedEnd =
              workOrder.scheduledEndAt?.getTime() ??
              requestedStart +
                (workOrder.estimatedDuration ?? 0) *
                  60 *
                  1000;

            const conflict =
              assignments.find(
                (assignment) => {
                  if (!assignment.scheduledAt) {
                    return false;
                  }

                  const assignmentStart =
                    assignment.scheduledAt.getTime();

                  const assignmentEnd =
                    assignment.scheduledEndAt?.getTime() ??
                    assignmentStart +
                      (assignment.estimatedDuration ?? 0) *
                        60 *
                        1000;

                  return (
                    requestedStart <
                      assignmentEnd &&
                    requestedEnd >
                      assignmentStart
                  );
                },
              );

            if (conflict) {
              hasScheduleConflict = true;
              conflictingWorkOrder =
                conflict;
            }
          }

          let reason: string | null = null;

          if (!item.isActive) {
            reason =
              "Equipment is inactive";
          } else if (hasScheduleConflict) {
            reason = `Already assigned to work order ${
              conflictingWorkOrder?.reference
            } at this time`;
          }

          return {
            id: item.id,
            code: item.code,
            name: item.name,
            category: item.category,
            serialNumber: item.serialNumber,
            isActive: item.isActive,
            available: reason === null,
            reason,
          };
        },
      ),
    );

    return {
  workOrderId:
    workOrder.id,

  estimatedDuration:
    workOrder.estimatedDuration,

  requiredSkills:
    workOrder.workOrderSkills.map(
      (item) => item.skill,
    ),

  weather,

  available:
    results.filter(
      (technician) =>
        technician.available,
    ),

  notAvailable:
    results.filter(
      (technician) =>
        !technician.available,
    ),

  equipment: equipmentResults,
};
}

export async function unassignWorkOrder(
  id: string,
  reason: string,
  actorId: string,
  actorRole: string,
) {
  const existingWorkOrder =
    await prisma.workOrder.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        technicianId: true,
        technician: {
          select: {
            userId: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

  if (!existingWorkOrder) {
    throw new Error("Work order not found");
  }

  if (!existingWorkOrder.technicianId) {
    throw new Error(
      "Work order is not assigned to a technician",
    );
  }

  if (
    existingWorkOrder.status === "IN_PROGRESS" &&
    actorRole !== "SUPERVISOR"
  ) {
    throw new Error(
      "IN_PROGRESS work orders can only be unassigned by a supervisor",
    );
  }

  const technicianUserId =
    existingWorkOrder.technician?.userId;

  return prisma.$transaction(async (tx) => {
    const workOrder =
      await tx.workOrder.update({
        where: {
          id,
        },
        data: {
          technicianId: null,
          status: "SCHEDULED",
        },
        include: {
          client: true,
          site: true,
          technician: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  role: true,
                  isActive: true,
                },
              },
            },
          },
          equipment: true,
        },
      });

    await tx.workOrderEvent.create({
      data: {
        workOrderId: id,
        actorId,
        eventType: "TECHNICIAN_UNASSIGNED",
        oldValue:
          existingWorkOrder.technician?.user.fullName ??
          existingWorkOrder.technicianId,
        newValue: reason,
      },
    });

    if (technicianUserId) {
      await tx.notification.create({
        data: {
          userId: technicianUserId,
          type: "TECHNICIAN_UNASSIGNED",
          title: "Work order unassigned",
          message: `Work order ${id} has been unassigned. Reason: ${reason}`,
        },
      });
    }

    return workOrder;
  });
}