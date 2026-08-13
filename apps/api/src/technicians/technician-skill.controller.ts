import type { Request, Response } from "express";

import {
  addTechnicianSkill,
  getTechnicianSkills,
  removeTechnicianSkill,
} from "./technician-skill.service.js";

import {
  addTechnicianSkillSchema,
  technicianSkillParamsSchema,
} from "./technician-skill.schemas.js";

export async function addTechnicianSkillController(
  req: Request,
  res: Response
) {
  try {
    const { technicianId } = technicianSkillParamsSchema
      .pick({ technicianId: true })
      .parse(req.params);

    const data = addTechnicianSkillSchema.parse(req.body);

    const technicianSkill = await addTechnicianSkill({
      technicianId,
      skillId: data.skillId,
      certificationExpiresAt: data.certificationExpiresAt,
    });

    res.status(201).json(technicianSkill);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function getTechnicianSkillsController(
  req: Request,
  res: Response
) {
  try {
    const { technicianId } = technicianSkillParamsSchema
      .pick({ technicianId: true })
      .parse(req.params);

    const skills = await getTechnicianSkills(technicianId);

    res.json(skills);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function removeTechnicianSkillController(
  req: Request,
  res: Response
) {
  try {
    const { technicianId, skillId } =
      technicianSkillParamsSchema.parse(req.params);

    await removeTechnicianSkill(technicianId, skillId);

    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}