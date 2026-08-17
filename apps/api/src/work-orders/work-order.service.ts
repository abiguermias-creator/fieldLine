import { prisma } from "../db/client.js";

type WorkOrderPriority = "P1" | "P2" | "P3" | "P4";

type WorkOrderStatus =
  | "NEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CLOSED"
  | "CANCELLED";

function calculateSlaTargets(
  priority: WorkOrderPriority,
  createdAt: Date,
  agreedDate?: Date | null
) {
  let slaRespondBy: Date | null = null;
  let slaResolveBy: Date | null = null;

  switch (priority) {
    case "P1":
      slaRespondBy = new Date(
        createdAt.getTime() + 1 * 60 * 60 * 1000
      );

      slaResolveBy = new Date(
        createdAt.getTime() + 4 * 60 * 60 * 1000
      );
      break;

    case "P2":
      slaRespondBy = new Date(
        createdAt.getTime() + 4 * 60 * 60 * 1000
      );

      slaResolveBy = new Date(
        createdAt.getTime() + 24 * 60 * 60 * 1000
      );
      break;

    case "P3":
      slaRespondBy = new Date(
        createdAt.getTime() + 24 * 60 * 60 * 1000
      );

      slaResolveBy = new Date(
        createdAt.getTime() + 5 * 24 * 60 * 60 * 1000
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
      (word) => word.length >= 3 && !stopWords.has(word)
    );
}

async function findPossibleDuplicate(
  siteId: string,
  title: string,
  excludeId?: string
) {
  const twoHoursAgo = new Date(
    Date.now() - 2 * 60 * 60 * 1000
  );

  const words = findSignificantWords(title);

  if (words.length === 0) {
    return null;
  }

  const recentOrders = await prisma.workOrder.findMany({
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
      findSignificantWords(order.title)
    );

    const sharedWords = words.filter((word) =>
      existingWords.has(word)
    );

    const score =
      sharedWords.length /
      Math.max(words.length, existingWords.size);

    if (sharedWords.length >= 2 && score >= 0.4 && score > bestScore) {
      bestScore = score;
      bestMatch = order;
    }
  }

  return bestMatch;
}

export async function createWorkOrder(data: {
  clientId: string;
  siteId: string;
  title: string;
  description?: string;
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
      "Site does not belong to the selected client"
    );
  }

  const possibleDuplicate = await findPossibleDuplicate(
    data.siteId,
    data.title
  );

  if (possibleDuplicate && data.duplicateConfirmed !== true) {
    const duplicateError = new Error(
      "Possible duplicate work order found"
    );

    (duplicateError as Error & {
      code?: string;
      duplicate?: unknown;
    }).code = "POSSIBLE_DUPLICATE";

    (duplicateError as Error & {
      code?: string;
      duplicate?: unknown;
    }).duplicate = possibleDuplicate;

    throw duplicateError;
  }

  const createdAt = new Date();

  const agreedDate = data.agreedDate
    ? new Date(data.agreedDate)
    : null;

  const { slaRespondBy, slaResolveBy } =
    calculateSlaTargets(
      data.priority,
      createdAt,
      agreedDate
    );

  return prisma.$transaction(async (tx) => {
    const year = createdAt.getFullYear();

    const existingSequence =
      await tx.workOrderSequence.findUnique({
        where: {
          year,
        },
      });

    let sequence: number;

    if (!existingSequence) {
      await tx.workOrderSequence.create({
        data: {
          year,
          lastNumber: 1,
        },
      });

      sequence = 1;
    } else {
      const updatedSequence =
        await tx.workOrderSequence.update({
          where: {
            year,
          },
          data: {
            lastNumber: {
              increment: 1,
            },
          },
        });

      sequence = updatedSequence.lastNumber;
    }

    const reference = `WO-${year}-${String(sequence).padStart(
      4,
      "0"
    )}`;

    return tx.workOrder.create({
      data: {
        reference,
        clientId: data.clientId,
        siteId: data.siteId,
        title: data.title,
        description: data.description,
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

  if (query.statuses && query.statuses.length > 0) {
    where.status = {
      in: query.statuses,
    };
  }

  if (query.priorities && query.priorities.length > 0) {
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

  if (query.createdFrom || query.createdTo) {
    where.createdAt = {};

    if (query.createdFrom) {
      where.createdAt.gte = new Date(query.createdFrom);
    }

    if (query.createdTo) {
      where.createdAt.lte = new Date(query.createdTo);
    }
  }

  const allItems = await prisma.workOrder.findMany({
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

  const direction = query.sortOrder === "asc" ? 1 : -1;

  allItems.sort((a, b) => {
    if (query.sortBy === "createdAt") {
      return (
        (a.createdAt.getTime() - b.createdAt.getTime()) *
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
        .filter((date): date is Date => date !== null)
        .map((date) => date.getTime());

      if (targets.length === 0) {
        return Number.MAX_SAFE_INTEGER;
      }

      return Math.min(...targets);
    };

    return (
      (getNearestSla(a) - getNearestSla(b)) *
      direction
    );
  });

  const total = allItems.length;

  const skip = (query.page - 1) * query.limit;

  const items = allItems.slice(
    skip,
    skip + query.limit
  );

  return {
    items,
    pagination: {
      total,
      page: query.page,
      pageSize: query.limit,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getWorkOrderById(id: string) {
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
      },
    },
  });
}

export async function updateWorkOrder(
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: WorkOrderStatus;
    priority?: WorkOrderPriority;
    estimatedDuration?: number | null;
    skillIds?: string[];
    agreedDate?: string | null;
    technicianId?: string | null;
    equipmentId?: string | null;
    scheduledAt?: string | null;
  },
  actorId: string
) {
  const existingWorkOrder =
    await prisma.workOrder.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        estimatedDuration: true,
        createdAt: true,
        agreedDate: true,
        technicianId: true,
        equipmentId: true,
        scheduledAt: true,
        workOrderSkills: {
          select: {
            skillId: true,
          },
        },
      },
    });

  if (!existingWorkOrder) {
    throw new Error("Work order not found");
  }

  if (
    existingWorkOrder.status === "CLOSED" ||
    existingWorkOrder.status === "CANCELLED"
  ) {
    throw new Error(
      "Closed or cancelled work orders cannot be edited"
    );
  }

  const nextPriority =
    data.priority ?? existingWorkOrder.priority;

  const nextAgreedDate =
    data.agreedDate !== undefined
      ? data.agreedDate
        ? new Date(data.agreedDate)
        : null
      : existingWorkOrder.agreedDate;

  const shouldRecalculateSla =
    data.priority !== undefined ||
    data.agreedDate !== undefined;

  let slaRespondBy: Date | null | undefined;
  let slaResolveBy: Date | null | undefined;

  if (shouldRecalculateSla) {
    const targets = calculateSlaTargets(
      nextPriority,
      existingWorkOrder.createdAt,
      nextAgreedDate
    );

    slaRespondBy = targets.slaRespondBy;
    slaResolveBy = targets.slaResolveBy;
  }

  return prisma.$transaction(async (tx) => {
    const events: Array<{
      eventType: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    if (
      data.title !== undefined &&
      data.title !== existingWorkOrder.title
    ) {
      events.push({
        eventType: "FIELD_CHANGED",
        oldValue: existingWorkOrder.title,
        newValue: data.title,
      });
    }

    if (
      data.description !== undefined &&
      data.description !== existingWorkOrder.description
    ) {
      events.push({
        eventType: "FIELD_CHANGED",
        oldValue: existingWorkOrder.description,
        newValue: data.description,
      });
    }

    if (
      data.priority !== undefined &&
      data.priority !== existingWorkOrder.priority
    ) {
      events.push({
        eventType: "PRIORITY_CHANGED",
        oldValue: existingWorkOrder.priority,
        newValue: data.priority,
      });
    }

    if (
      data.estimatedDuration !== undefined &&
      data.estimatedDuration !==
        existingWorkOrder.estimatedDuration
    ) {
      events.push({
        eventType: "FIELD_CHANGED",
        oldValue:
          existingWorkOrder.estimatedDuration !== null
            ? String(existingWorkOrder.estimatedDuration)
            : null,
        newValue:
          data.estimatedDuration !== null
            ? String(data.estimatedDuration)
            : null,
      });
    }

    if (
      data.technicianId !== undefined &&
      data.technicianId !== existingWorkOrder.technicianId
    ) {
      events.push({
        eventType: "FIELD_CHANGED",
        oldValue: existingWorkOrder.technicianId,
        newValue: data.technicianId,
      });
    }

    if (
      data.equipmentId !== undefined &&
      data.equipmentId !== existingWorkOrder.equipmentId
    ) {
      events.push({
        eventType: "FIELD_CHANGED",
        oldValue: existingWorkOrder.equipmentId,
        newValue: data.equipmentId,
      });
    }

    if (
      data.scheduledAt !== undefined &&
      (data.scheduledAt
        ? new Date(data.scheduledAt).getTime()
        : null) !==
        (existingWorkOrder.scheduledAt
          ? existingWorkOrder.scheduledAt.getTime()
          : null)
    ) {
      events.push({
        eventType: "FIELD_CHANGED",
        oldValue:
          existingWorkOrder.scheduledAt?.toISOString() ?? null,
        newValue: data.scheduledAt
          ? new Date(data.scheduledAt).toISOString()
          : null,
      });
    }

    if (
      data.status !== undefined &&
      data.status !== existingWorkOrder.status
    ) {
      events.push({
        eventType: "STATUS_CHANGED",
        oldValue: existingWorkOrder.status,
        newValue: data.status,
      });
    }

    const workOrder = await tx.workOrder.update({
      where: {
        id,
      },

      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        estimatedDuration: data.estimatedDuration,

        agreedDate:
          data.agreedDate !== undefined
            ? nextAgreedDate
            : undefined,

        slaRespondBy,
        slaResolveBy,

        equipmentId: data.equipmentId,
        technicianId: data.technicianId,

        scheduledAt:
          data.scheduledAt !== undefined
            ? data.scheduledAt
              ? new Date(data.scheduledAt)
              : null
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
      const oldSkillIds = existingWorkOrder.workOrderSkills
        .map((item) => item.skillId)
        .sort();

      const newSkillIds = [...data.skillIds].sort();

      const skillsChanged =
        JSON.stringify(oldSkillIds) !==
        JSON.stringify(newSkillIds);

      if (skillsChanged) {
        await tx.workOrderSkill.deleteMany({
          where: {
            workOrderId: id,
          },
        });

        if (newSkillIds.length > 0) {
          await tx.workOrderSkill.createMany({
            data: newSkillIds.map((skillId) => ({
              workOrderId: id,
              skillId,
            })),
          });
        }

        events.push({
          eventType: "SKILLS_CHANGED",
          oldValue: JSON.stringify(oldSkillIds),
          newValue: JSON.stringify(newSkillIds),
        });
      }
    }

    for (const event of events) {
      await tx.workOrderEvent.create({
        data: {
          workOrderId: id,
          actorId,
          eventType: event.eventType,
          oldValue: event.oldValue,
          newValue: event.newValue,
        },
      });
    }

    return workOrder;
  });
}

export async function cancelWorkOrder(
  id: string,
  reason: string,
  actorId: string
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
      },
    });

  if (!existingWorkOrder) {
    throw new Error("Work order not found");
  }

  if (existingWorkOrder.status === "COMPLETED") {
    throw new Error(
      "Completed work orders cannot be cancelled"
    );
  }

  if (
    existingWorkOrder.status === "CLOSED" ||
    existingWorkOrder.status === "CANCELLED"
  ) {
    throw new Error(
      "Closed or cancelled work orders cannot be cancelled"
    );
  }

  return prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.update({
      where: {
        id,
      },
      data: {
        status: "CANCELLED",
        cancellationReason: reason,
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
        eventType: "WORK_ORDER_CANCELLED",
        oldValue: existingWorkOrder.status,
        newValue: reason,
      },
    });

    return workOrder;
  });
}

export async function deleteWorkOrder(id: string) {
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
  }
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      clientId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.clientId) {
    throw new Error(
      "Client company is not assigned to this user"
    );
  }

  if (
    data.priority === "P1" &&
    data.p1Confirmed !== true
  ) {
    throw new Error(
      "P1 requires confirmation before submission"
    );
  }

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

  if (site.clientId !== user.clientId) {
    throw new Error(
      "You can only create requests for your company's sites"
    );
  }

    const possibleDuplicate = await findPossibleDuplicate(
    data.siteId,
    data.title
  );

  if (possibleDuplicate && data.duplicateConfirmed !== true) {
    const duplicateError = new Error(
      "Possible duplicate work order found"
    );

    (duplicateError as Error & {
      code?: string;
      duplicate?: unknown;
    }).code = "POSSIBLE_DUPLICATE";

    (duplicateError as Error & {
      code?: string;
      duplicate?: unknown;
    }).duplicate = possibleDuplicate;

    throw duplicateError;
  }

  const createdAt = new Date();

  const agreedDate = data.agreedDate
    ? new Date(data.agreedDate)
    : null;

  const { slaRespondBy, slaResolveBy } =
    calculateSlaTargets(
      data.priority,
      createdAt,
      agreedDate
    );

  const result = await prisma.$transaction(async (tx) => {
    const year = createdAt.getFullYear();

    const existingSequence =
      await tx.workOrderSequence.findUnique({
        where: {
          year,
        },
      });

    let sequence: number;

    if (!existingSequence) {
      await tx.workOrderSequence.create({
        data: {
          year,
          lastNumber: 1,
        },
      });

      sequence = 1;
    } else {
      const updatedSequence =
        await tx.workOrderSequence.update({
          where: {
            year,
          },
          data: {
            lastNumber: {
              increment: 1,
            },
          },
        });

      sequence = updatedSequence.lastNumber;
    }

    const reference = `WO-${year}-${String(sequence).padStart(
      4,
      "0"
    )}`;

    const workOrder = await tx.workOrder.create({
      data: {
        reference,
        clientId: user.clientId!,
        siteId: data.siteId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: "NEW",

        agreedDate,
        slaRespondBy,
        slaResolveBy,
      },
    });

    return workOrder;
  });

  return {
    reference: result.reference,
    responseTarget: result.slaRespondBy,
    workOrder: result,
  };
}

export async function createFollowUpWorkOrder(
  originalWorkOrderId: string
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
    throw new Error("Work order not found");
  }

  if (originalWorkOrder.status !== "CLOSED") {
    throw new Error(
      "Only closed work orders can have a follow-up"
    );
  }

  if (originalWorkOrder.followUpWorkOrders.length > 0) {
    throw new Error(
      "This work order already has a follow-up"
    );
  }

  const createdAt = new Date();

  return prisma.$transaction(async (tx) => {
    const year = createdAt.getFullYear();

    const existingSequence =
      await tx.workOrderSequence.findUnique({
        where: {
          year,
        },
      });

    let sequence: number;

    if (!existingSequence) {
      await tx.workOrderSequence.create({
        data: {
          year,
          lastNumber: 1,
        },
      });

      sequence = 1;
    } else {
      const updatedSequence =
        await tx.workOrderSequence.update({
          where: {
            year,
          },
          data: {
            lastNumber: {
              increment: 1,
            },
          },
        });

      sequence = updatedSequence.lastNumber;
    }

    const reference = `WO-${year}-${String(
      sequence
    ).padStart(4, "0")}`;

    const followUp = await tx.workOrder.create({
      data: {
        reference,
        clientId: originalWorkOrder.clientId,
        siteId: originalWorkOrder.siteId,

        title: `Follow-up: ${originalWorkOrder.title}`,
        description: originalWorkOrder.description,

        priority: originalWorkOrder.priority,
        status: "NEW",

        originalWorkOrderId: originalWorkOrder.id,

        workOrderSkills: {
          create: originalWorkOrder.workOrderSkills.map(
            ({ skillId }) => ({
              skillId,
            })
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
  });
}