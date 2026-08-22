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
  getAssignmentOptionsController,
  unassignWorkOrderController,
} from "./work-order.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

const dispatcherOnly = requireRole("DISPATCHER", "SUPERVISOR");

const clientOnly = requireRole("CLIENT");

router.post("/:id/follow-up", requireAuth, createFollowUpWorkOrderController);

router.post("/", requireAuth, dispatcherOnly, createWorkOrderController);

router.post("/request", requireAuth, clientOnly, createClientRequestController);

router.patch("/:id/cancel", requireAuth, cancelWorkOrderController);

router.get("/", requireAuth, getWorkOrdersController);

router.get("/:id/assignment-options",requireAuth,dispatcherOnly,getAssignmentOptionsController,);

router.get("/:id", requireAuth, getWorkOrderController);

router.patch("/:id/unassign", requireAuth, dispatcherOnly, unassignWorkOrderController);

router.patch("/:id", requireAuth, updateWorkOrderController);

router.patch("/:id", requireAuth, updateWorkOrderController);

router.delete("/:id", requireAuth, deleteWorkOrderController);

export default router;