import { prisma } from "../db/client.js";

export async function createEquipment(data: {
  code: string;
  name: string;
  category: string;
  description?: string;
}) {
  const existingCode = await prisma.equipment.findUnique({
    where: {
      code: data.code,
    },
  });

  if (existingCode) {
    throw new Error(
      `Equipment with code "${data.code}" already exists.`
    );
  }

  return prisma.equipment.create({
    data: {
      code: data.code,
      name: data.name,
      category: data.category,
      description: data.description,
    },
  });
}

export async function getEquipment() {
  return prisma.equipment.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getEquipmentById(id: string) {
  return prisma.equipment.findUnique({
    where: {
      id,
    },
  });
}

export async function updateEquipment(
  id: string,
  data: {
    code?: string;
    name?: string;
    category?: string;
    description?: string;
  }
) {
  const equipment = await prisma.equipment.findUnique({
    where: {
      id,
    },
  });

  if (!equipment) {
    throw new Error("Equipment not found.");
  }

  if (data.code && data.code !== equipment.code) {
    const existingCode = await prisma.equipment.findUnique({
      where: {
        code: data.code,
      },
    });

    if (existingCode) {
      throw new Error(
        `Equipment with code "${data.code}" already exists.`
      );
    }
  }

  return prisma.equipment.update({
    where: {
      id,
    },
    data: {
      code: data.code,
      name: data.name,
      category: data.category,
      description: data.description,
    },
  });
}

async function hasFutureWorkOrder(id: string) {
  const count = await prisma.workOrder.count({
    where: {
      equipmentId: id,
      scheduledAt: {
        gt: new Date(),
      },
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
    },
  });

  return count > 0;
}

export async function deleteEquipment(id: string) {
  const equipment = await prisma.equipment.findUnique({
    where: {
      id,
    },
  });

  if (!equipment) {
    throw new Error("Equipment not found.");
  }

  const assignedToFutureWorkOrder = await hasFutureWorkOrder(id);

  if (assignedToFutureWorkOrder) {
    throw new Error(
      "Cannot delete equipment. It is assigned to a future work order."
    );
  }

  return prisma.equipment.delete({
    where: {
      id,
    },
  });
}

export async function deactivateEquipment(id: string) {
  const equipment = await prisma.equipment.findUnique({
    where: {
      id,
    },
  });

  if (!equipment) {
    throw new Error("Equipment not found.");
  }

  const assignedToFutureWorkOrder = await hasFutureWorkOrder(id);

  if (assignedToFutureWorkOrder) {
    throw new Error(
      "Cannot deactivate equipment. It is assigned to a future work order."
    );
  }

  return prisma.equipment.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
}

export async function activateEquipment(id: string) {
  const equipment = await prisma.equipment.findUnique({
    where: {
      id,
    },
  });

  if (!equipment) {
    throw new Error("Equipment not found.");
  }

  return prisma.equipment.update({
    where: {
      id,
    },
    data: {
      isActive: true,
    },
  });
}