import { Router } from "express";

import {
  createClientController,
  getClientsController,
  getClientController,
  updateClientController,
  deleteClientController,
  deactivateClientController,
  activateClientController,
} from "./client.controller.js";

import { requireAuth } from "../middleware/auth.js";

import { requireRole } from "../middleware/role.js";

const router = Router();

const canManageClients = requireRole("DISPATCHER", "SUPERVISOR");

router.get("/", requireAuth, getClientsController);

router.get("/:id", requireAuth, getClientController);

router.post("/", requireAuth, canManageClients, createClientController);

router.patch("/:id", requireAuth, canManageClients, updateClientController);

router.delete("/:id", requireAuth, canManageClients, deleteClientController);

router.patch("/:id/activate", requireAuth, canManageClients, activateClientController);

router.patch("/:id/deactivate", requireAuth, canManageClients, deactivateClientController);

export default router;
