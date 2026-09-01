import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { DomainError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  _next,
) => {
  const requestId = req.id;

  if (err instanceof DomainError) {
    logger.info(
      {
        requestId,
        code: err.code,
        details: err.details,
      },
      err.message,
    );

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_FAILED",
        message: "Some fields need attention.",
        details: {
          fields: err.flatten().fieldErrors,
        },
        requestId,
      },
    });
  }

  logger.error(
    {
      requestId,
      err,
    },
    "Unhandled server error",
  );

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
      details: {},
      requestId,
    },
  });
};
