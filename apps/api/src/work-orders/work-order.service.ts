import { prisma } from "../db/client.js";

type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH";

type WorkOrderStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export async function createWorkOrder(data: {
  clientId: string;
  siteId: string;
  title: string;
  description?: string;
  priority?: WorkOrderPriority;
}) {
  return prisma.workOrder.create({
    data: {
      clientId: data.clientId,
      siteId: data.siteId,
      title: data.title,
      description: data.description,
      priority: data.priority ?? "MEDIUM",
    },
  });
}

export async function getWorkOrders(query: {
  page: number;
  limit: number;
  status?: WorkOrderStatus;
  sort: "createdAt" | "priority";
}) {
  const skip = (query.page - 1) * query.limit;

  const where = query.status
    ? { status: query.status }
    : {};

  const [items, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: {
        [query.sort]: "desc",
      },
      include: {
        client: true,
        site: true,
      },
    }),
    prisma.workOrder.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getWorkOrderById(id: string) {
  return prisma.workOrder.findUnique({
    where: { id },
    include: {
      client: true,
      site: true,
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
  }
) {
  return prisma.workOrder.update({
    where: { id },
    data,
  });
}

export async function deleteWorkOrder(id: string) {
  return prisma.workOrder.delete({
    where: { id },
  });
}