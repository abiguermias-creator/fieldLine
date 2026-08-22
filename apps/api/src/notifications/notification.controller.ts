import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { getNotifications } from "./notification.service.js";

export async function getNotificationsController(
  req: AuthRequest,
  res: Response,
) {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const notifications = await getNotifications(
    req.user.userId,
  );

  res.json(notifications);
}