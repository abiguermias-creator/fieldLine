import type { RequestHandler } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { prisma } from "../db/client.js";
import { ZodError } from "zod";

import {
  registerSchema,
  loginSchema,
} from "./auth.schemas.js";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "./auth.service.js";

import { config } from "../lib/config.js";


export const register: RequestHandler = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const user = await registerUser(data);

    const result = await loginUser({
      email: data.email,
      password: data.password,
    });

    res.cookie(
      "refreshToken",
      result.refreshToken,
      {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge:
  config.REFRESH_TOKEN_DAYS *
  24 *
  60 *
  60 *
  1000,
      }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.user,
      accessToken: result.accessToken,
    });

  } catch (error: any) {

    if (error instanceof ZodError) {
      const firstError = error.errors[0];

      return res.status(400).json({
        message: firstError?.message ?? "Invalid input",
        field: firstError?.path[0] ?? null,
      });
    }

    return res.status(400).json({
      message: error.message,
    });
  }
};
export const login: RequestHandler = async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const result = await loginUser(data);


    res.cookie(
      "refreshToken",
      result.refreshToken,
      {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge:
  config.REFRESH_TOKEN_DAYS *
  24 *
  60 *
  60 *
  1000,
      }
    );


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



export const refresh: RequestHandler = async (req, res) => {
  try {

    const refreshToken = req.cookies.refreshToken;


    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token",
      });
    }


    const accessToken =
      await refreshAccessToken(refreshToken);


    res.json({
      accessToken,
    });


  } catch (error: any) {
    res.status(401).json({
      message: error.message,
    });
  }
};



export const logout: RequestHandler = async (req, res) => {
  try {

    const refreshToken =
      req.cookies.refreshToken;


    if (refreshToken) {
      await logoutUser(refreshToken);
    }


    res.clearCookie("refreshToken");


    res.json({
      message: "Logged out successfully",
    });


  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};



export const me = async (
  req: AuthRequest,
  res: any
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    res.json({
      user: {
        ...user,
        clientCompanyId: null,
      },
    });
  } catch {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};