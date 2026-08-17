import { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { z } from "zod";

import {
  createWorkOrder,
  createClientRequest,
  deleteWorkOrder,
  getWorkOrderById,
  getWorkOrders,
  updateWorkOrder,
  cancelWorkOrder,
  createFollowUpWorkOrder,
} from "./work-order.service.js";

import {
  createWorkOrderSchema,
  createClientRequestSchema,
  listWorkOrderQuerySchema,
  updateWorkOrderSchema,
  cancelWorkOrderSchema,
} from "./work-order.schemas.js";

export async function createWorkOrderController(
  req: Request,
  res: Response
) {
  try {
    const data = createWorkOrderSchema.parse(req.body);

    const workOrder = await createWorkOrder(data);

    res.status(201).json(workOrder);
  } catch (error) {
    if (error instanceof Error) {
      const typedError = error as Error & {
        code?: string;
        duplicate?: unknown;
      };

      if (typedError.code === "POSSIBLE_DUPLICATE") {
        return res.status(409).json({
          message:
            "A possible duplicate work order was found.",
          duplicate: typedError.duplicate,
        });
      }

      if (error.message === "Site not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "Site does not belong to the selected client"
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create work order",
    });
  }
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
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = updateWorkOrderSchema.parse(req.body);

    const workOrder = await updateWorkOrder(
      req.params.id as string,
      data,
      req.user.userId
    );

    res.json(workOrder);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "Closed or cancelled work orders cannot be edited"
      ) {
        return res.status(409).json({
          message: error.message,
        });
      }

      if (error.message === "Work order not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update work order",
    });
  }
}

export async function cancelWorkOrderController(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = cancelWorkOrderSchema.parse(
      req.body
    );

    const workOrder = await cancelWorkOrder(
      req.params.id as string,
      data.reason,
      req.user.userId
    );

    res.json(workOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message ||
          "Invalid cancellation request",
      });
    }

    if (error instanceof Error) {
      if (
        error.message ===
          "Completed work orders cannot be cancelled" ||
        error.message ===
          "Closed or cancelled work orders cannot be cancelled"
      ) {
        return res.status(409).json({
          message: error.message,
        });
      }

      if (error.message === "Work order not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to cancel work order",
    });
  }
}

export async function deleteWorkOrderController(
  req: Request,
  res: Response
) {
  await deleteWorkOrder(req.params.id as string);

  res.status(204).send();
}
export async function createClientRequestController(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = createClientRequestSchema.parse(req.body);

    const workOrder = await createClientRequest(
      req.user.userId,
      data
    );

    res.status(201).json(workOrder);
  } catch (error) {
    if (error instanceof Error) {
      const typedError = error as Error & {
        code?: string;
        duplicate?: unknown;
      };

      if (typedError.code === "POSSIBLE_DUPLICATE") {
        return res.status(409).json({
          message: "Possible duplicate work order found",
          code: "POSSIBLE_DUPLICATE",
          duplicate: typedError.duplicate,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create request",
    });
  }
}

export async function createFollowUpWorkOrderController(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const workOrder =
      await createFollowUpWorkOrder(
        req.params.id as string
      );

    res.status(201).json(workOrder);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Work order not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
          "Only closed work orders can have a follow-up" ||
        error.message ===
          "This work order already has a follow-up"
      ) {
        return res.status(409).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create follow-up work order",
    });
  }
}