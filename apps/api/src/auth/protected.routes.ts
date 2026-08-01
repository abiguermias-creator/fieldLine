import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get(
  "/protected",
  requireAuth,
  (req: AuthRequest, res) => {
    res.json({
      message: "Protected route works",
      user: req.user,
    });
  }
);

export default router;