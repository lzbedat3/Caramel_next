import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/config/env";
import type { Database } from "@/types/database";

let client: SupabaseClient<Database> | undefined;

// Reads public content as an anonymous visitor. It never touches cookies, so
// pages that use it can be prerendered and served from cache.
export function createPublicClient(): SupabaseClient<Database> {
  if (!client) {
    const { supabaseUrl, supabasePublishableKey } = getPublicEnv();
    client = createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}
