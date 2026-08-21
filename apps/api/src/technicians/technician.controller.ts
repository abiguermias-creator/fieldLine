import type { Request, Response } from "express";

import {
  createTechnician,
  getTechnicians,
  getTechnicianById,
  updateTechnician,
  deactivateTechnician,
  activateTechnician,
} from "./technician.service.js";

import {
  createTechnicianSchema,
  updateTechnicianSchema,
  technicianIdSchema,
  listTechniciansQuerySchema,
} from "./technician.schemas.js";

export async function createTechnicianController(req: Request, res: Response) {
  try {
    const data = createTechnicianSchema.parse(req.body);

    const technician = await createTechnician(data);

    res.status(201).json(technician);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function getTechniciansController(req: Request, res: Response) {
  try {
    const query = listTechniciansQuerySchema.parse(req.query);

    const technicians = await getTechnicians(query.page, query.limit, query.search, query.skillId);

    res.json(technicians);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function getTechnicianController(req: Request, res: Response) {
  try {
    const { id } = technicianIdSchema.parse(req.params);

    const technician = await getTechnicianById(id);

    if (!technician) {
      return res.status(404).json({
        message: "Technician not found",
      });
    }

    res.json(technician);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function updateTechnicianController(req: Request, res: Response) {
  try {
    const { id } = technicianIdSchema.parse(req.params);
    const data = updateTechnicianSchema.parse(req.body);

    const technician = await updateTechnician(id, data);

    res.json(technician);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function deactivateTechnicianController(req: Request, res: Response) {
  try {
    const { id } = technicianIdSchema.parse(req.params);

    const technician = await deactivateTechnician(id);

    res.json(technician);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function activateTechnicianController(req: Request, res: Response) {
  try {
    const { id } = technicianIdSchema.parse(req.params);

    const technician = await activateTechnician(id);

    res.json(technician);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}