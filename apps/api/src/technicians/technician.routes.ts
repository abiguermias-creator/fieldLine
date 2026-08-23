import { Router } from "express";

import {
  createTechnicianController,
  getTechniciansController,
  getTechnicianController,
  getMyDayController,
  updateTechnicianController,
  deactivateTechnicianController,
  activateTechnicianController,
  updateTechnicianLocationController,
  updateMyLocationSharingController,
} from "./technician.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("DISPATCHER", "SUPERVISOR"), createTechnicianController);

router.get("/", requireRole("DISPATCHER", "SUPERVISOR"), getTechniciansController);

router.get("/me/day", requireRole("TECHNICIAN"), getMyDayController);

router.post("/me/location", requireRole("TECHNICIAN"), updateTechnicianLocationController);

router.patch("/me/location-sharing", requireRole("TECHNICIAN"), updateMyLocationSharingController);

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
