import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import { config } from "../lib/config.js";


export interface AuthRequest extends Request {

  user?: {
    userId: string;
    role: string;
  };

}



export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {

  const authHeader =
    req.headers.authorization;


  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }


  const token =
    authHeader.split(" ")[1];


  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }


  try {

    const decoded =
      jwt.verify(
        token,
        config.JWT_SECRET
      ) as {
        userId: string;
        role: string;
      };


    req.user = decoded;


    next();


  } catch {

    return res.status(401).json({
      message: "Invalid token",
    });

  }

}
export function requireRole(...allowedRoles: string[]) {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };
}
