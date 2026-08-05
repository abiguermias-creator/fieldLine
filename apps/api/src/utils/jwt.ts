import jwt from "jsonwebtoken";
import { config } from "../lib/config.js";

export function createAccessToken(
  userId: string,
  role: string
) {
  return jwt.sign(
    {
      userId,
      role,
    },
    config.JWT_SECRET,
    {
      expiresIn: "30s",
    }
  );
}


export function createRefreshToken(
  userId: string,
  role: string
) {
  return jwt.sign(
    {
      userId,
      role,
    },
    config.JWT_SECRET,
    {
      expiresIn: "2m",
    }
  );
}


export function verifyToken(token: string) {
  return jwt.verify(
    token,
    config.JWT_SECRET
  ) as {
    userId: string;
    role: string;
  };
}