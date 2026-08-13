import { Request, Response } from "express";

import {
  createSkill,
  deleteSkill,
  getSkillById,
  getSkills,
  updateSkill,
} from "./skills.service.js";

import {
  createSkillSchema,
  updateSkillSchema,
} from "./skills.schemas.js";

type SkillParams = {
  id: string;
};

export async function createSkillController(
  req: Request,
  res: Response
) {
  try {
    const data = createSkillSchema.parse(req.body);

    const skill = await createSkill(data);

    return res.status(201).json(skill);
  } catch (error: any) {
    return res.status(409).json({
      message: error.message,
    });
  }
}

export async function getSkillsController(
  _req: Request,
  res: Response
) {
  try {
    const skills = await getSkills();

    return res.json(skills);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function getSkillController(
  req: Request<SkillParams>,
  res: Response
) {
  try {
    const skill = await getSkillById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        message: "Skill not found",
      });
    }

    return res.json(skill);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function updateSkillController(
  req: Request<SkillParams>,
  res: Response
) {
  try {
    const data = updateSkillSchema.parse(req.body);

    const skill = await updateSkill(
      req.params.id,
      data
    );

    return res.json(skill);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
}

export async function deleteSkillController(
  req: Request<SkillParams>,
  res: Response
) {
  try {
    await deleteSkill(req.params.id);

    return res.json({
      message: "Skill deleted successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
}