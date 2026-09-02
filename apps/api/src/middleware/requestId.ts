import type { Request, RequestHandler } from "express";
import { ulid } from "ulid";

type RequestWithId = Request & {
  id?: string;
};

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const request = req as RequestWithId;
  const incomingId = request.header("x-request-id");
  const id =
    incomingId && incomingId.trim().length > 0
      ? incomingId.trim()
      : ulid();

  request.id = id;
  res.setHeader("x-request-id", id);

  next();
};
