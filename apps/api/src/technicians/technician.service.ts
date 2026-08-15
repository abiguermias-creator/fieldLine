import argon2 from "argon2";
import { prisma } from "../db/client.js";

export async function createTechnician(data: {
  email: string;
  password: string;
  fullName: string;
  employeeCode: string;
  baseLocation: string;
  maxWorkingMinutesPerDay?: number;
  phone?: string;
  bio?: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const existingEmployee = await prisma.technicianProfile.findUnique({
    where: {
      employeeCode: data.employeeCode,
    },
  });

  if (existingEmployee) {
    throw new Error(
      `A technician with employee code "${data.employeeCode}" already exists.`
    );
  }

  const passwordHash = await argon2.hash(data.password);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: "TECHNICIAN",
      },
    });

    const technician = await tx.technicianProfile.create({
      data: {
        userId: user.id,
        employeeCode: data.employeeCode,
        baseLocation: data.baseLocation,
        maxWorkingMinutesPerDay:
          data.maxWorkingMinutesPerDay ?? 480,
        phone: data.phone,
        bio: data.bio,
      },
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
    });

    return technician;
  });
}

export async function getTechnicians(
  page = 1,
  limit = 25,
  search = "",
  skillId?: string
) {
  const skip = (page - 1) * limit;

  const where = {
  ...(search
    ? {
        OR: [
          {
            employeeCode: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            baseLocation: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            user: {
              fullName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : {}),
  ...(skillId
    ? {
        technicianSkills: {
          some: {
            skillId,
          },
        },
      }
    : {}),
};

  const [items, total] = await Promise.all([
    prisma.technicianProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
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
    }),

    prisma.technicianProfile.count({
      where,
    }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getTechnicianById(id: string) {
  return prisma.technicianProfile.findUnique({
    where: {
      id,
    },
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
      workOrders: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function updateTechnician(
  id: string,
  data: {
    fullName?: string;
    employeeCode?: string;
    baseLocation?: string;
    maxWorkingMinutesPerDay?: number;
    phone?: string;
    bio?: string;
  }
) {
  const technician = await prisma.technicianProfile.findUnique({
    where: {
      id,
    },
  });

  if (!technician) {
    throw new Error("Technician not found.");
  }

  if (data.employeeCode && data.employeeCode !== technician.employeeCode) {
    const existingEmployee =
      await prisma.technicianProfile.findUnique({
        where: {
          employeeCode: data.employeeCode,
        },
      });

    if (existingEmployee) {
      throw new Error(
        `A technician with employee code "${data.employeeCode}" already exists.`
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedProfile = await tx.technicianProfile.update({
      where: {
        id,
      },
      data: {
        employeeCode: data.employeeCode,
        baseLocation: data.baseLocation,
        maxWorkingMinutesPerDay:
          data.maxWorkingMinutesPerDay,
        phone: data.phone,
        bio: data.bio,
      },
    });

    if (data.fullName !== undefined) {
      await tx.user.update({
        where: {
          id: technician.userId,
        },
        data: {
          fullName: data.fullName,
        },
      });
    }

    return tx.technicianProfile.findUnique({
      where: {
        id: updatedProfile.id,
      },
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
    });
  });
}

export async function deactivateTechnician(id: string) {
  const technician = await prisma.technicianProfile.findUnique({
    where: {
      id,
    },
  });

  if (!technician) {
    throw new Error("Technician not found.");
  }

  const futureAssignments = await prisma.workOrder.count({
    where: {
      technicianId: technician.id,
      scheduledAt: {
        gt: new Date(),
      },
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
    },
  });

  if (futureAssignments > 0) {
    throw new Error(
      `Cannot deactivate technician. They have ${futureAssignments} future assignment${
        futureAssignments === 1 ? "" : "s"
      }. Reassign them first.`
    );
  }

  return prisma.user.update({
    where: {
      id: technician.userId,
    },
    data: {
      isActive: false,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });
}
export async function activateTechnician(id: string) {
  const technician = await prisma.technicianProfile.findUnique({
    where: {
      id,
    },
  });

  if (!technician) {
    throw new Error("Technician not found.");
  }

  return prisma.user.update({
    where: {
      id: technician.userId,
    },
    data: {
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });
}