import {
  buildRateLimitKey,
  consumeRateLimit,
  resolveClientAddress,
  resolveRateLimitRule,
  resetRateLimitStore
} from "@/lib/runtime/rate-limit";

describe("rate limiting", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("matches mutating API routes", () => {
    expect(resolveRateLimitRule("/api/sales", "POST")).toEqual({
      scope: "api-mutation",
      limit: 30,
      windowMs: 60000
    });
  });

  it("matches public receipt reads", () => {
    expect(resolveRateLimitRule("/r/token-1", "GET")).toEqual({
      scope: "public-receipt",
      limit: 60,
      windowMs: 60000
    });
  });

  it("resolves the client address from forwarding headers", () => {
    const request = {
      headers: new Headers({
        "x-forwarded-for": "10.0.0.1, 10.0.0.2"
      }),
      ip: null
    };

    expect(resolveClientAddress(request)).toBe("10.0.0.1");
  });

  it("blocks requests after the limit is exhausted and resets after the window", () => {
    const key = buildRateLimitKey("api-mutation", "local", "/api/sales");

    expect(consumeRateLimit({ key, limit: 2, windowMs: 1000, now: 0 }).allowed).toBe(true);
    expect(consumeRateLimit({ key, limit: 2, windowMs: 1000, now: 100 }).allowed).toBe(true);
    expect(consumeRateLimit({ key, limit: 2, windowMs: 1000, now: 200 }).allowed).toBe(false);
    expect(consumeRateLimit({ key, limit: 2, windowMs: 1000, now: 1200 }).allowed).toBe(true);
  });
});
