import { Router } from "express";

import {
  createEquipmentController,
  getEquipmentController,
  getEquipmentByIdController,
  updateEquipmentController,
  deleteEquipmentController,
  deactivateEquipmentController,
  activateEquipmentController,
} from "./equipment.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("DISPATCHER", "SUPERVISOR"), createEquipmentController);

router.get("/", requireRole("DISPATCHER", "SUPERVISOR"), getEquipmentController);

router.get("/:id", requireRole("DISPATCHER", "SUPERVISOR"), getEquipmentByIdController);

router.patch("/:id", requireRole("DISPATCHER", "SUPERVISOR"), updateEquipmentController);

router.delete("/:id", requireRole("DISPATCHER", "SUPERVISOR"), deleteEquipmentController);

router.patch(
  "/:id/deactivate",
  requireRole("DISPATCHER", "SUPERVISOR"),
  deactivateEquipmentController,
);

router.patch("/:id/activate", requireRole("DISPATCHER", "SUPERVISOR"), activateEquipmentController);

export default router;
