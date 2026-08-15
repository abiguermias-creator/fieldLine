import { Router } from "express";

import {
  createSiteController,
  deleteSiteController,
  deactivateSiteController,
  getSiteController,
  getSitesController,
  updateSiteController,
  updateSiteLocationController,
} from "./site.controller.js";

import {
  requireAuth,
} from "../middleware/auth.js";

import { requireRole } from "../middleware/role.js";

const router = Router();

const canManageSites = requireRole(
  "DISPATCHER",
  "SUPERVISOR"
);

router.post(
  "/",
  requireAuth,
  canManageSites,
  createSiteController
);

router.get(
  "/",
  requireAuth,
  getSitesController
);

router.get(
  "/:id",
  requireAuth,
  getSiteController
);

router.patch(
  "/:id/location",
  requireAuth,
  canManageSites,
  updateSiteLocationController
);

router.patch(
  "/:id",
  requireAuth,
  canManageSites,
  updateSiteController
);

router.delete(
  "/:id",
  requireAuth,
  canManageSites,
  deleteSiteController
);

router.patch(
  "/:id/deactivate",
  requireAuth,
  canManageSites,
  deactivateSiteController
);

export default router;