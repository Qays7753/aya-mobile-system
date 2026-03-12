import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(16).optional()
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedPublicEnv: PublicEnv | null = null;
let cachedServerEnv: ServerEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (cachedPublicEnv) {
    return cachedPublicEnv;
  }

  cachedPublicEnv = publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  return cachedPublicEnv;
}

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  cachedServerEnv = serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET
  });

  return cachedServerEnv;
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function getCronSecret(options?: { allowMissing?: boolean }) {
  const value = process.env.CRON_SECRET?.trim();

  if (!value) {
    if (options?.allowMissing || !isProductionRuntime()) {
      return null;
    }

    throw new Error("ERR_ENV_CRON_SECRET_MISSING");
  }

  if (value.length < 16) {
    throw new Error("ERR_ENV_CRON_SECRET_INVALID");
  }

  return value;
}

export function getCronAuthorizationHeader(options?: { allowMissing?: boolean }) {
  const secret = getCronSecret(options);
  return secret ? `Bearer ${secret}` : null;
}
