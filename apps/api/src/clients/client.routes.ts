import { Router } from "express";
import {
  createClientController,
  getClientsController,
  getClientController,
  updateClientController,
  deleteClientController,
  deactivateClientController,
  activateClientController
} from "./client.controller.js";

const router = Router();

router.post("/", createClientController);

router.get("/", getClientsController);

router.get("/:id", getClientController);

router.patch("/:id", updateClientController);

router.delete("/:id", deleteClientController);

router.patch("/:id/activate", activateClientController);

router.patch("/:id/deactivate", deactivateClientController);

export default router;