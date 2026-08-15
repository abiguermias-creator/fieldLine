import { Router } from "express";

import {
  createSkillController,
  deleteSkillController,
  getSkillController,
  getSkillsController,
  updateSkillController,
} from "./skills.controller.js";

import {
  requireAuth,
} from "../middleware/auth.js";

import { requireRole } from "../middleware/role.js";

const router = Router();

const canManageSkills = requireRole(
  "DISPATCHER",
  "SUPERVISOR"
);

router.get(
  "/",
  requireAuth,
  getSkillsController
);

router.get(
  "/:id",
  requireAuth,
  getSkillController
);

router.post(
  "/",
  requireAuth,
  canManageSkills,
  createSkillController
);

router.patch(
  "/:id",
  requireAuth,
  canManageSkills,
  updateSkillController
);

router.delete(
  "/:id",
  requireAuth,
  canManageSkills,
  deleteSkillController
);

export default router;