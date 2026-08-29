import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminSocialLink = Tables<"social_links">;

export const getAdminSocialLinks = cache(
  async (): Promise<AdminSocialLink[]> => {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (error || !data) {
        return [];
      }

      return data;
    } catch {
      return [];
    }
  },
);
