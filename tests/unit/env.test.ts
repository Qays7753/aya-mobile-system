import { getCronAuthorizationHeader, getCronSecret } from "@/lib/env";

describe("cron env policy", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousCronSecret = process.env.CRON_SECRET;
  const env = process.env as Record<string, string | undefined>;

  afterEach(() => {
    env.NODE_ENV = previousNodeEnv;
    env.CRON_SECRET = previousCronSecret;
  });

  it("allows a missing cron secret outside production", () => {
    env.NODE_ENV = "test";
    delete env.CRON_SECRET;

    expect(getCronSecret({ allowMissing: true })).toBeNull();
    expect(getCronAuthorizationHeader({ allowMissing: true })).toBeNull();
  });

  it("throws in production when the cron secret is missing", () => {
    env.NODE_ENV = "production";
    delete env.CRON_SECRET;

    expect(() => getCronSecret()).toThrow("ERR_ENV_CRON_SECRET_MISSING");
  });

  it("returns a bearer header for a valid cron secret", () => {
    env.NODE_ENV = "production";
    env.CRON_SECRET = "secret-secret-1234";

    expect(getCronSecret()).toBe("secret-secret-1234");
    expect(getCronAuthorizationHeader()).toBe("Bearer secret-secret-1234");
  });
});
