import { Router } from "express";
import {
  createWorkOrderController,
  createClientRequestController,
  deleteWorkOrderController,
  getWorkOrderController,
  getWorkOrdersController,
  updateWorkOrderController,
  cancelWorkOrderController,
  createFollowUpWorkOrderController,
} from "./work-order.controller.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";

const router = Router();

const dispatcherOnly = requireRole(
  "DISPATCHER",
  "SUPERVISOR"
);

const clientOnly = requireRole("CLIENT");

router.post(
  "/:id/follow-up",
  requireAuth,
  createFollowUpWorkOrderController
);

router.post(
  "/",
  requireAuth,
  dispatcherOnly,
  createWorkOrderController
);

// US-402: Client creates a request
router.post(
  "/request",
  requireAuth,
  clientOnly,
  createClientRequestController
);

router.patch(
  "/:id/cancel",
  requireAuth,
  cancelWorkOrderController
);

router.get(
  "/",
  requireAuth,
  getWorkOrdersController
);

router.get(
  "/:id",
  requireAuth,
  getWorkOrderController
);

router.patch(
  "/:id",
  requireAuth,
  updateWorkOrderController
);

router.delete(
  "/:id",
  requireAuth,
  deleteWorkOrderController
);

export default router;