import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { InvalidTransitionError } from "../lib/errors.js";
import { z } from "zod";

const router = Router();

router.get(
  "/client-only",
  requireAuth,
  requireRole("CLIENT"),
  (_req, res) => {
    res.json({
      message: "Client access granted",
    });
  },
);

router.get(
  "/admin-only",
  requireAuth,
  requireRole("SUPERVISOR"),
  (_req, res) => {
    res.json({
      message: "Supervisor access granted",
    });
  },
);

router.get("/error-409", () => {
  throw new InvalidTransitionError(
    "This transition is not allowed.",
  );
});

router.post("/error-422", (req) => {
  z.object({
    requiredField: z.string(),
  }).parse(req.body);
});

export default router;