import { prisma } from "../db/client.js";

export async function createClient(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactName?: string;
}) {
  const existingClient = await prisma.client.findFirst({
    where: {
      name: {
        equals: data.name,
        mode: "insensitive",
      },
    },
  });

  const client = await prisma.client.create({
    data,
  });

  if (existingClient) {
    // Keep the duplicate check without changing the API response shape.
    console.warn("A client with this name already exists");
  }

  return client;
}

export async function getClients(page = 1, search = "") {
  const pageSize = 25;

  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      }
    : {};

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.client.count({
      where,
    }),
  ]);

  return {
    items: clients,
    total,
    page,
    pageSize,
  };
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      sites: true,
      workOrders: true,
    },
  });
}

export async function updateClient(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    contactName?: string;
  },
) {
  return prisma.client.update({
    where: { id },
    data,
  });
}

export async function deleteClient(id: string) {
  const workOrderCount = await prisma.workOrder.count({
    where: {
      clientId: id,
    },
  });

  if (workOrderCount > 0) {
    throw new Error(
      `Cannot delete client. It has ${workOrderCount} work orders. Deactivate instead.`,
    );
  }

  return prisma.client.delete({
    where: { id },
  });
}

export async function activateClient(id: string) {
  return prisma.client.update({
    where: {
      id,
    },
    data: {
      isActive: true,
    },
  });
}

export async function deactivateClient(id: string) {
  return prisma.client.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
}
