import { Router } from "express";
import {
  createWorkOrderController,
  deleteWorkOrderController,
  getWorkOrderController,
  getWorkOrdersController,
  updateWorkOrderController,
} from "./work-order.controller.js";

const router = Router();

router.post("/", createWorkOrderController);

router.get("/", getWorkOrdersController);

router.get("/:id", getWorkOrderController);

router.patch("/:id", updateWorkOrderController);

router.delete("/:id", deleteWorkOrderController);

export default router;