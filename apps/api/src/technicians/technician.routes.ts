import { Router } from "express";

import {
  createTechnicianController,
  getTechniciansController,
  getTechnicianController,
  updateTechnicianController,
  deactivateTechnicianController,
  activateTechnicianController,
} from "./technician.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("DISPATCHER", "SUPERVISOR"), createTechnicianController);

router.get("/", requireRole("DISPATCHER", "SUPERVISOR"), getTechniciansController);

router.get("/:id", requireRole("DISPATCHER", "SUPERVISOR"), getTechnicianController);

router.patch("/:id", requireRole("DISPATCHER", "SUPERVISOR"), updateTechnicianController);

router.patch(
  "/:id/deactivate",
  requireRole("DISPATCHER", "SUPERVISOR"),
  deactivateTechnicianController,
);

router.patch(
  "/:id/activate",
  requireRole("DISPATCHER", "SUPERVISOR"),
  activateTechnicianController,
);

export default router;
