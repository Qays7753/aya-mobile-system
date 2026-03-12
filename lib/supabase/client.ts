"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

type SupabaseDatabase = any;

export function createSupabaseBrowserClient() {
  const env = getPublicEnv();

  return createBrowserClient<SupabaseDatabase>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
