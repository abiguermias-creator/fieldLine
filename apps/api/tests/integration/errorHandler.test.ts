import request from "supertest";
import { describe, expect, it } from "vitest";
import express from "express";
import { z } from "zod";
import { InvalidTransitionError } from "../../src/lib/errors.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import { requestIdMiddleware } from "../../src/middleware/requestId.js";

const errorTestApp = express();

errorTestApp.use(requestIdMiddleware);
errorTestApp.use(express.json());

errorTestApp.get("/error-409", (_req, _res, next) => {
  next(
    new InvalidTransitionError(
      "This transition is not allowed.",
    ),
  );
});

errorTestApp.post("/error-422", (_req, _res, next) => {
  const schema = z.object({
    requiredField: z.string(),
  });

  const result = schema.safeParse({});

  if (!result.success) {
    return next(result.error);
  }

  return next();
});

errorTestApp.use(errorHandler);

describe("error envelopes", () => {
  it("returns a consistent 409 error envelope with request ID", async() => {
    const response = await request(errorTestApp)
      .get("/error-409")
      .set("x-request-id", "test-request-409");

    expect(response.status).toBe(409);
    expect(response.headers["x-request-id"]).toBe("test-request-409");
    expect(response.body.error.code).toBe("INVALID_TRANSITION");
    expect(response.body.error.message).toBe(
      "This transition is not allowed.",
    );
    expect(response.body.error.requestId).toBe("test-request-409");
  });

  it("returns a consistent 422 error envelope with request ID", async() => {
    const response = await request(errorTestApp)
      .post("/error-422")
      .set("x-request-id", "test-request-422")
      .send({});

    expect(response.status).toBe(422);
    expect(response.headers["x-request-id"]).toBe("test-request-422");
    expect(response.body.error.code).toBe("VALIDATION_FAILED");
    expect(response.body.error.message).toBe(
      "Some fields need attention.",
    );
    expect(response.body.error.requestId).toBe("test-request-422");
  });
});