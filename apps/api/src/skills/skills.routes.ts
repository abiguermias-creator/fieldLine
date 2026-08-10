import { Router } from "express";

import {
  createSkillController,
  deleteSkillController,
  getSkillController,
  getSkillsController,
  updateSkillController,
} from "./skills.controller.js";

const router = Router();

router.post("/", createSkillController);

router.get("/", getSkillsController);

router.get("/:id", getSkillController);

router.patch("/:id", updateSkillController);

router.delete("/:id", deleteSkillController);

export default router;