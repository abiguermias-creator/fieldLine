import { Router } from "express";

import { register, login, refresh, logout, me } from "./auth.controller.js";

import { requireAuth } from "../middleware/auth.js";

import { loginRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", register);

router.post("/login", loginRateLimiter, login);

router.post("/refresh", refresh);

router.post("/logout", logout);

router.get("/me", requireAuth, me);

export default router;
