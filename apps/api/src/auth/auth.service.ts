import argon2 from "argon2";

import { prisma } from "../db/client.js";
import { config } from "../lib/config.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from "../utils/jwt.js";

import type {
  RegisterInput,
  LoginInput,
} from "./auth.schemas.js";


export async function registerUser(data: RegisterInput) {

  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
  throw new Error("An account with this email already exists.");
}


  const passwordHash = await argon2.hash(
    data.password
  );


  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: "CLIENT",
    },
  });


  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

export async function loginUser(data: LoginInput) {

  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });


  if (!user) {
  throw new Error("Email or password is incorrect");
}


  const passwordValid = await argon2.verify(
    user.passwordHash,
    data.password
  );


  if (!passwordValid) {
  throw new Error("Email or password is incorrect");
}

if (!user.isActive) {
  throw new Error("This account is not active");
}

  const accessToken = createAccessToken(
    user.id,
    user.role
  );


  const refreshToken = createRefreshToken(
    user.id,
    user.role
  );


  await prisma.refreshToken.create({
  data: {
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(
      Date.now() +
      config.REFRESH_TOKEN_DAYS *
      24 *
      60 *
      60 *
      1000
    ),
  },
});

  await prisma.user.update({
  where: {
    id: user.id,
  },
  data: {
    lastLoginAt: new Date(),
  },
});

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(
  refreshToken: string
) {

  const storedToken =
    await prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
    });


  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }


  if (storedToken.expiresAt < new Date()) {

    await prisma.refreshToken.delete({
      where: {
        token: refreshToken,
      },
    });

    throw new Error("Refresh token expired");
  }


  const decoded = verifyToken(refreshToken);


  const newAccessToken =
    createAccessToken(
      decoded.userId,
      decoded.role
    );


  return newAccessToken;
}

export async function logoutUser(
  refreshToken: string
) {

  await prisma.refreshToken.deleteMany({
    where: {
      token: refreshToken,
    },
  });

}