import type { RequestHandler } from "express";
import type { UserRole } from "@prisma/client";

import type {
  AuthRequest
} from "./auth.js";


export function requireRole(
  ...roles: UserRole[]
): RequestHandler {


  return (
    req,
    res,
    next
  ) => {


    const authReq =
      req as AuthRequest;



    if (!authReq.user) {

      return res.status(401).json({
        message: "Unauthorized",
      });

    }



    const userRole =
      authReq.user.role as UserRole;



    if (!roles.includes(userRole)) {

      return res.status(403).json({
        message: "Forbidden",
      });

    }


    next();

  };

}