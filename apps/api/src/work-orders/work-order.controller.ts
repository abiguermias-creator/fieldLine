import { Request, Response } from "express";
import {
  createWorkOrder,
  deleteWorkOrder,
  getWorkOrderById,
  getWorkOrders,
  updateWorkOrder,
} from "./work-order.service.js";
import {
  createWorkOrderSchema,
  listWorkOrderQuerySchema,
  updateWorkOrderSchema,
} from "./work-order.schemas.js";

export async function createWorkOrderController(
  req: Request,
  res: Response
) {
  const data = createWorkOrderSchema.parse(req.body);

  const workOrder = await createWorkOrder(data);

  res.status(201).json(workOrder);
}

export async function getWorkOrdersController(
  req: Request,
  res: Response
) {
  const query = listWorkOrderQuerySchema.parse(req.query);

  const result = await getWorkOrders(query);

  res.json(result);
}

export async function getWorkOrderController(
  req: Request,
  res: Response
) {
  const workOrder = await getWorkOrderById(req.params.id as string);

  if (!workOrder) {
    return res.status(404).json({
      message: "Work order not found",
    });
  }

  res.json(workOrder);
}

export async function updateWorkOrderController(
  req: Request,
  res: Response
) {
  const data = updateWorkOrderSchema.parse(req.body);

  const workOrder = await updateWorkOrder(
    req.params.id as string,
    data
  );

  res.json(workOrder);
}

export async function deleteWorkOrderController(
  req: Request,
  res: Response
) {
  await deleteWorkOrder(req.params.id as string);

  res.status(204).send();
}