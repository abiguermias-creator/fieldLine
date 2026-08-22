import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

router.get("/client-only", requireAuth, requireRole("CLIENT"), (_req, res) => {
  res.json({
    message: "Client access granted",
  });
});

router.get("/admin-only", requireAuth, requireRole("SUPERVISOR"), (_req, res) => {
  res.json({
    message: "Supervisor access granted",
  });
});

export default router;
