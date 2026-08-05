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
      expiresIn: `${config.ACCESS_TOKEN_MINUTES}m`,
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
      expiresIn: `${config.REFRESH_TOKEN_DAYS}d`,
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