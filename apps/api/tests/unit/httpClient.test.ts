import { afterEach, describe, expect, it, vi } from "vitest";
import { resilientFetch } from "../../src/integrations/httpClient.js";

describe("resilientFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns data immediately when the request succeeds", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await resilientFetch<{ ok: boolean }>(
      "https://example.com",
    );

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 500 error and succeeds", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response("Server error", { status: 500 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await resilientFetch<{ ok: boolean }>(
      "https://example.com",
      {
        maxRetries: 1,
      },
    );

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 4xx error", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response("Bad request", { status: 400 }),
      );

    await expect(
      resilientFetch("https://example.com", {
        maxRetries: 3,
      }),
    ).rejects.toThrow("HTTP 400");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a network failure", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("Network failure"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await resilientFetch<{ ok: boolean }>(
      "https://example.com",
      {
        maxRetries: 1,
      },
    );

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("aborts a request that exceeds the timeout", async () => {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation((_url, options) => {
      return new Promise((_resolve, reject) => {
        const signal = options?.signal;

        signal?.addEventListener("abort", () => {
          reject(
            new DOMException("The operation was aborted", "AbortError"),
          );
        });
      });
    });

  await expect(
    resilientFetch("https://example.com", {
      timeoutMs: 10,
      maxRetries: 0,
    }),
  ).rejects.toThrow("Request timed out after 10ms");

  expect(fetchMock).toHaveBeenCalledTimes(1);

  const [, requestOptions] = fetchMock.mock.calls[0];
  expect(requestOptions?.signal?.aborted).toBe(true);
});
});