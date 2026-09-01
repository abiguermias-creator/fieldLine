import { Router } from "express";
import multer from "multer";
import { workOrderPhotoUpload } from "./work-order-photo-upload.js";
import {
  createWorkOrderController,
  createClientRequestController,
  deleteWorkOrderController,
  getWorkOrderController,
  getWorkOrdersController,
  updateWorkOrderController,
  cancelWorkOrderController,
  createFollowUpWorkOrderController,
  getAssignmentOptionsController,
  unassignWorkOrderController,
  moveWorkOrderStatusController,
  createWorkLogController,
  getWorkLogsController,
  getWorkOrderPhotosController,
  createWorkOrderPhotoController,
  markWorkOrderWaitingOnPartsController,
} from "./work-order.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { DomainError } from "../lib/errors.js";

const router = Router();

const dispatcherOnly = requireRole("DISPATCHER", "SUPERVISOR");

const clientOnly = requireRole("CLIENT");

router.post("/:id/follow-up", requireAuth, createFollowUpWorkOrderController);

router.post("/", requireAuth, dispatcherOnly, createWorkOrderController);

router.post("/request", requireAuth, clientOnly, createClientRequestController);

router.patch("/:id/cancel", requireAuth, cancelWorkOrderController);

router.get("/", requireAuth, getWorkOrdersController);

router.get("/:id/assignment-options",requireAuth,dispatcherOnly,getAssignmentOptionsController,);

router.patch("/:id/status-action",requireAuth,requireRole("TECHNICIAN"),moveWorkOrderStatusController,);

router.patch("/:id/waiting-on-parts",requireAuth,requireRole("TECHNICIAN"),markWorkOrderWaitingOnPartsController,);

router.post("/:id/work-logs",requireAuth,requireRole("TECHNICIAN"),createWorkLogController,);

router.get("/:id/work-logs",requireAuth,getWorkLogsController,);

router.get("/:id/photos",requireAuth,getWorkOrderPhotosController,);

router.post("/:id/photos",requireAuth,requireRole("TECHNICIAN"),
    (req, res, next) => {
    workOrderPhotoUpload.single("photo")(
      req,
      res,
      (error) => {
        if (error instanceof multer.MulterError) {
          if (error.code === "LIMIT_FILE_SIZE") {
            return next(
              new DomainError(
                "VALIDATION_FAILED",
                "Photo must be 10 MB or smaller",
                422,
              ),
            );
          }

          return next(
            new DomainError(
              "VALIDATION_FAILED",
              error.message,
              422,
            ),
          );
        }

        if (error instanceof Error) {
          return next(
            new DomainError(
              "VALIDATION_FAILED",
              error.message,
              422,
            ),
          );
        }

        next();
      },
    );
  },
  createWorkOrderPhotoController,
);

router.get("/:id", requireAuth, getWorkOrderController);

router.patch("/:id/unassign", requireAuth, dispatcherOnly, unassignWorkOrderController);

router.patch("/:id", requireAuth, updateWorkOrderController);

router.delete("/:id", requireAuth, deleteWorkOrderController);

export default router;