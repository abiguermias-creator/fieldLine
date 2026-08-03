import { Router } from "express";
import {
  createClientController,
  deleteClientController,
  getClientController,
  getClientsController,
  updateClientController,
} from "./client.controller.js";

const router = Router();

router.post("/", createClientController);

router.get("/", getClientsController);

router.get("/:id", getClientController);

router.patch("/:id", updateClientController);

router.delete("/:id", deleteClientController);

export default router;