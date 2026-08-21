import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getNotificationsController } from "./notification.controller.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  getNotificationsController,
);

export default router;