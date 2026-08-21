import { prisma } from "../db/client.js";

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
    },
  });
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}