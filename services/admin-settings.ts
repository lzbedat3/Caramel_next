import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminSiteSettings = Tables<"site_settings">;

export const getAdminSiteSettings = cache(
  async (): Promise<AdminSiteSettings | null> => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  },
);
