import type { Request, Response } from "express";

import {
  createEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  deactivateEquipment,
  activateEquipment,
} from "./equipment.service.js";

import {
  createEquipmentSchema,
  updateEquipmentSchema,
  equipmentIdSchema,
} from "./equipment.schemas.js";

export async function createEquipmentController(
  req: Request,
  res: Response
) {
  try {
    const data = createEquipmentSchema.parse(req.body);

    const equipment = await createEquipment(data);

    res.status(201).json(equipment);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function getEquipmentController(
  req: Request,
  res: Response
) {
  try {
    const equipment = await getEquipment();

    res.json(equipment);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function getEquipmentByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = equipmentIdSchema.parse(req.params);

    const equipment = await getEquipmentById(id);

    if (!equipment) {
      return res.status(404).json({
        message: "Equipment not found",
      });
    }

    res.json(equipment);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function updateEquipmentController(
  req: Request,
  res: Response
) {
  try {
    const { id } = equipmentIdSchema.parse(req.params);
    const data = updateEquipmentSchema.parse(req.body);

    const equipment = await updateEquipment(id, data);

    res.json(equipment);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function deleteEquipmentController(
  req: Request,
  res: Response
) {
  try {
    const { id } = equipmentIdSchema.parse(req.params);

    await deleteEquipment(id);

    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function deactivateEquipmentController(
  req: Request,
  res: Response
) {
  try {
    const { id } = equipmentIdSchema.parse(req.params);

    const equipment = await deactivateEquipment(id);

    res.json(equipment);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function activateEquipmentController(
  req: Request,
  res: Response
) {
  try {
    const { id } = equipmentIdSchema.parse(req.params);

    const equipment = await activateEquipment(id);

    res.json(equipment);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}