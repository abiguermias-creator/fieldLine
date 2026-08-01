import type { RequestHandler } from "express";
import type { AuthRequest } from "../middleware/auth.js";

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


    res.cookie(
      "refreshToken",
      result.refreshToken,
      {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
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

  res.json({
    user: req.user,
  });

};