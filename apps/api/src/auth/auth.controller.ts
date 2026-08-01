import type { RequestHandler, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";

import { prisma } from "../db/client.js";
import { registerSchema, loginSchema } from "./auth.schemas.js";

import {
  registerUser,
  loginUser,
} from "./auth.service.js";

import {
  createAccessToken,
  verifyToken,
} from "../utils/jwt.js";


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

res.cookie("refreshToken", result.refreshToken, {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

res.json({
  user: result.user,
  accessToken: result.accessToken,
});

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
  res: Response
) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.userId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(user);

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const refresh: RequestHandler = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token",
      });
    }

    const decoded = verifyToken(refreshToken);

    const newAccessToken = createAccessToken(decoded.userId);

    return res.json({
      accessToken: newAccessToken,
    });

  } catch {
    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }
};