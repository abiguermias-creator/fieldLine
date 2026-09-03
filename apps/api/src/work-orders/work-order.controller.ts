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
  unassignWorkOrder,
  createFollowUpWorkOrder,
  getAssignmentOptions,
  moveWorkOrderStatus,
  createWorkLog,
  getWorkLogs,
  getWorkOrderPhotos,
  createWorkOrderPhoto,
  markWorkOrderWaitingOnParts,
} from "./work-order.service.js";

import {
  createWorkOrderSchema,
  createClientRequestSchema,
  listWorkOrderQuerySchema,
  updateWorkOrderSchema,
  cancelWorkOrderSchema,
  unassignWorkOrderSchema,
  createWorkLogSchema,
  waitingOnPartsSchema,
  moveWorkOrderStatusSchema,
} from "./work-order.schemas.js";

export async function createWorkOrderController(req: Request, res: Response) {
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
          message: "A possible duplicate work order was found.",
          duplicate: typedError.duplicate,
        });
      }

      if (error.message === "Site not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "Site does not belong to the selected client") {
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

export async function getWorkOrdersController(req: Request, res: Response) {
  const query = listWorkOrderQuerySchema.parse(req.query);

  const result = await getWorkOrders(query);

  res.json(result);
}

export async function getWorkOrderController(req: Request, res: Response) {
  const workOrder = await getWorkOrderById(req.params.id as string);

  if (!workOrder) {
    return res.status(404).json({
      message: "Work order not found",
    });
  }

  res.json(workOrder);
}

export async function updateWorkOrderController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = updateWorkOrderSchema.parse(req.body);

    const workOrder = await updateWorkOrder(req.params.id as string, data, req.user.userId);

    res.json(workOrder);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Closed or cancelled work orders cannot be edited") {
  return res.status(409).json({
    message: error.message,
  });
}

if (
  error.message.startsWith("SKILL_NOT_HELD:") ||
  error.message.startsWith("SKILL_EXPIRED:")
) {
  const [code, ...messageParts] =
    error.message.split(": ");

  return res.status(409).json({
    code,
    message: messageParts.join(": "),
  });
}

if (
  error.message.startsWith("TECHNICIAN_UNAVAILABLE:")
) {
  const [code, ...messageParts] =
    error.message.split(": ");

  return res.status(409).json({
    code,
    message: messageParts.join(": "),
  });
}

if (
  error.message.startsWith(
    "TECHNICIAN_UNAVAILABLE:",
  )
) {
  const [code, ...messageParts] =
    error.message.split(": ");

  return res.status(409).json({
    code,
    message:
      messageParts.join(": "),
  });
}

if (error.message === "Technician not found") {
  return res.status(404).json({
    message: error.message,
  });
}

if (
  error.message === "Selected user is not a technician" ||
  error.message === "Technician account is inactive"
) {
  return res.status(409).json({
    message: error.message,
  });
}

if (error.message === "SCHEDULE_IN_PAST") {
  return res.status(400).json({
    code: "SCHEDULE_IN_PAST",
    message: "Scheduled start cannot be in the past",
  });
}

if (
  error.message.startsWith(
    "DAILY_HOURS_EXCEEDED:",
  )
) {
  const [code, ...messageParts] =
    error.message.split(": ");

  return res.status(409).json({
    code,
    message:
      messageParts.join(": "),
  });
}

if (
  error.message ===
  "DAILY_HOURS_OVERRIDE_REQUIRES_SUPERVISOR"
) {
  return res.status(403).json({
    code:
      "DAILY_HOURS_OVERRIDE_REQUIRES_SUPERVISOR",
    message:
      "Only a supervisor can override daily working hours",
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

export async function unassignWorkOrderController(
  req: AuthRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = unassignWorkOrderSchema.parse(req.body);

    const workOrder = await unassignWorkOrder(
      req.params.id as string,
      data.reason,
      req.user.userId,
      req.user.role,
    );

    res.json(workOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message:
          error.issues[0]?.message ||
          "Invalid unassignment request",
      });
    }

    if (error instanceof Error) {
      if (error.message === "Work order not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "Work order is not assigned to a technician"
      ) {
        return res.status(409).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "IN_PROGRESS work orders can only be unassigned by a supervisor"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to unassign work order",
    });
  }
}

export async function cancelWorkOrderController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = cancelWorkOrderSchema.parse(req.body);

    const workOrder = await cancelWorkOrder(req.params.id as string, data.reason, req.user.userId);

    res.json(workOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message || "Invalid cancellation request",
      });
    }

    if (error instanceof Error) {
      if (
        error.message === "Completed work orders cannot be cancelled" ||
        error.message === "Closed or cancelled work orders cannot be cancelled"
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

export async function deleteWorkOrderController(req: Request, res: Response) {
  await deleteWorkOrder(req.params.id as string);

  res.status(204).send();
}
export async function createClientRequestController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = createClientRequestSchema.parse(req.body);

    const workOrder = await createClientRequest(req.user.userId, data);

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

export async function createFollowUpWorkOrderController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const workOrder = await createFollowUpWorkOrder(req.params.id as string);

    res.status(201).json(workOrder);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Work order not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message === "Only closed work orders can have a follow-up" ||
        error.message === "This work order already has a follow-up"
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

export async function getAssignmentOptionsController(
  req: Request,
  res: Response,
) {
  try {
    const result = await getAssignmentOptions(
      req.params.id as string,
    );

    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
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
      message: "Failed to get assignment options",
    });
  }
}

export async function moveWorkOrderStatusController(
  req: AuthRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

      const data = moveWorkOrderStatusSchema.parse(req.body);

    const workOrder = await moveWorkOrderStatus(
      req.params.id as string,
      req.user.userId,
      data.action,
    );

    res.json(workOrder);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "Work order not found"
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
          "Work order is not assigned to a technician" ||
        error.message ===
          "Assigned technician not found"
      ) {
        return res.status(409).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "Only the assigned technician can move this work order"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      if (error.message === "WORK_LOG_REQUIRED") {
  return res.status(409).json({
    message:
      "At least one work log is required before completing this work order.",
  });
}

      return res.status(409).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message:
        "Failed to move work order status",
    });
  }
}

export async function markWorkOrderWaitingOnPartsController(
  req: AuthRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data =
      waitingOnPartsSchema.parse(req.body);

    const workOrder =
      await markWorkOrderWaitingOnParts(
        req.params.id as string,
        req.user.userId,
        data.description,
      );

    return res.json(workOrder);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "Work order not found"
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
          "Only work orders in progress can be marked as waiting on parts" ||
        error.message ===
          "Work order is not assigned to a technician" ||
        error.message ===
          "Assigned technician not found"
      ) {
        return res.status(409).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "Only the assigned technician can mark this work order as waiting on parts"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message:
        "Failed to mark work order as waiting on parts",
    });
  }
}

export async function createWorkLogController(
  req: AuthRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = createWorkLogSchema.parse(
      req.body,
    );

    const workLog = await createWorkLog(
      req.params.id as string,
      req.user.userId,
      data,
    );

    res.status(201).json(workLog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message:
          error.issues[0]?.message ||
          "Invalid work log",
      });
    }

    if (error instanceof Error) {
      if (
        error.message ===
        "Work order not found"
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "Technician profile not found"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "Only the assigned technician can add work logs"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "Work logs can only be added to work orders that are in progress"
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
      message: "Failed to create work log",
    });
  }
}

export async function getWorkLogsController(
  req: Request,
  res: Response,
) {
  try {
    const result = await getWorkLogs(
      req.params.id as string,
    );

    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "Work order not found"
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to get work logs",
    });
  }
}

export async function getWorkOrderPhotosController(
  req: Request,
  res: Response,
) {
  try {
    const photos = await getWorkOrderPhotos(
      req.params.id as string,
    );

    res.json(photos);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
        "Work order not found"
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to get work order photos",
    });
  }
}

export async function createWorkOrderPhotoController(
  req: AuthRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "An image file is required",
      });
    }

    const photo = await createWorkOrderPhoto(
      req.params.id as string,
      req.user.userId,
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    );

    res.status(201).json(photo);
  } catch (error) {
    if (error instanceof Error) {
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
      message: "Failed to upload work order photo",
    });
  }
}