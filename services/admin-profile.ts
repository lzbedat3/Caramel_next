import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { storageBuckets } from "@/config/storage";
import { getPublicStorageUrl, withCacheBust } from "@/lib/storage-url";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminRestaurantProfile = Tables<"restaurant_profile">;

export type AdminProfilePayload = {
  profile: AdminRestaurantProfile | null;
  logoSrc: string | null;
};

export const getAdminRestaurantProfile = cache(
  async (): Promise<AdminProfilePayload> => {
    if (!isSupabaseConfigured()) {
      return { profile: null, logoSrc: null };
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("restaurant_profile")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        return { profile: null, logoSrc: null };
      }

      return {
        profile: data,
        logoSrc: withCacheBust(
          getPublicStorageUrl(
            storageBuckets.branding,
            data?.logo_storage_path,
          ),
          data?.updated_at,
        ),
      };
    } catch {
      return { profile: null, logoSrc: null };
    }
  },
);
