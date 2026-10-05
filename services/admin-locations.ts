import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminLocation = Tables<"locations">;

// Every branch, including switched-off ones, in display order.
export const getAdminLocations = cache(async (): Promise<AdminLocation[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    return error || !data ? [] : data;
  } catch {
    return [];
  }
});
