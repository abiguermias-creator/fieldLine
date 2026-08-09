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

import { requireAuth } from "../middleware/auth.js";


const router = Router();


router.post(
  "/",
  requireAuth,
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
  updateSiteLocationController
);


router.patch(
  "/:id",
  requireAuth,
  updateSiteController
);


router.delete(
  "/:id",
  requireAuth,
  deleteSiteController
);


router.patch(
  "/:id/deactivate",
  requireAuth,
  deactivateSiteController
);


export default router;