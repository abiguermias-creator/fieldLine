import { Router } from "express";
import {
  createSiteController,
  deleteSiteController,
  getSiteController,
  getSitesController,
  updateSiteController,
} from "./site.controller.js";

const router = Router();

router.post("/", createSiteController);
router.get("/", getSitesController);
router.get("/:id", getSiteController);
router.patch("/:id", updateSiteController);
router.delete("/:id", deleteSiteController);

export default router;