import { prisma } from "../db/client.js";

export async function createClient(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactName?: string;
}) {
  return prisma.client.create({
    data,
  });
}

export async function getClients() {
  return prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
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
  }
) {
  return prisma.client.update({
    where: { id },
    data,
  });
}

export async function deleteClient(id: string) {
  return prisma.client.delete({
    where: { id },
  });
}