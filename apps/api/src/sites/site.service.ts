import { prisma } from "../db/client.js";

export async function createSite(data: {
  clientId: string;
  name: string;
  address?: string;
}) {
  return prisma.site.create({
    data,
  });
}

export async function getSites() {
  return prisma.site.findMany({
    include: {
      client: true,
      workOrders: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getSiteById(id: string) {
  return prisma.site.findUnique({
    where: { id },
    include: {
      client: true,
      workOrders: true,
    },
  });
}

export async function updateSite(
  id: string,
  data: {
    clientId?: string;
    name?: string;
    address?: string;
  }
) {
  return prisma.site.update({
    where: { id },
    data,
  });
}

export async function deleteSite(id: string) {
  return prisma.site.delete({
    where: { id },
  });
}