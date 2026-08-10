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
  const data = createSkillSchema.parse(req.body);

  const skill = await createSkill(data);

  res.status(201).json(skill);
}

export async function getSkillsController(
  _req: Request,
  res: Response
) {
  const skills = await getSkills();

  res.json(skills);
}

export async function getSkillController(
  req: Request<SkillParams>,
  res: Response
) {
  const skill = await getSkillById(req.params.id);

  if (!skill) {
    return res.status(404).json({
      message: "Skill not found",
    });
  }

  res.json(skill);
}

export async function updateSkillController(
  req: Request<SkillParams>,
  res: Response
) {
  const data = updateSkillSchema.parse(req.body);

  const skill = await updateSkill(
    req.params.id,
    data
  );

  res.json(skill);
}

export async function deleteSkillController(
  req: Request<SkillParams>,
  res: Response
) {
  await deleteSkill(req.params.id);

  res.json({
    message: "Skill deleted successfully",
  });
}