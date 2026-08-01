import type { RequestHandler } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "./auth.schemas.js";
import {
  registerUser,
  loginUser,
} from "./auth.service.js";


export const register: RequestHandler = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const user = await registerUser(data);

    res.status(201).json({
      message: "User registered successfully",
      user,
    });

  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};


export const login: RequestHandler = async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const result = await loginUser(data);

    res.json(result);

  } catch (error: any) {
    res.status(401).json({
      message: error.message,
    });
  }
};


export const logout: RequestHandler = async (_req, res) => {
  res.clearCookie("refreshToken");

  res.json({
    message: "Logged out successfully",
  });
};


export const me = async (
  req: AuthRequest,
  res: any
) => {
  res.json({
    user: req.user,
  });
};