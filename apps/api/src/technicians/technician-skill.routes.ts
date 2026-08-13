import { Router } from "express";

import {
  addTechnicianSkillController,
  getTechnicianSkillsController,
  removeTechnicianSkillController,
} from "./technician-skill.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/:technicianId/skills",
  requireRole("DISPATCHER", "SUPERVISOR"),
  getTechnicianSkillsController
);

router.post(
  "/:technicianId/skills",
  requireRole("DISPATCHER", "SUPERVISOR"),
  addTechnicianSkillController
);

router.delete(
  "/:technicianId/skills/:skillId",
  requireRole("DISPATCHER", "SUPERVISOR"),
  removeTechnicianSkillController
);

export default router;