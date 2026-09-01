import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

const app = createApp();

describe("error envelopes", () => {
  it("returns a consistent 409 error envelope with request ID", async () => {
    const response = await request(app)
      .get("/api/test/error-409")
      .set("x-request-id", "test-request-409");

    expect(response.status).toBe(409);
    expect(response.headers["x-request-id"]).toBe("test-request-409");
    expect(response.body.error.code).toBe("INVALID_TRANSITION");
    expect(response.body.error.message).toBe(
      "This transition is not allowed.",
    );
    expect(response.body.error.requestId).toBe("test-request-409");
  });

  it("returns a consistent 422 error envelope with request ID", async () => {
    const response = await request(app)
      .post("/api/test/error-422")
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
