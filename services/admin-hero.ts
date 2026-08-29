import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { storageBuckets } from "@/config/storage";
import { getPublicStorageUrl, withCacheBust } from "@/lib/storage-url";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminHeroItem = Tables<"hero_media"> & {
  src: string | null;
  posterSrc: string | null;
};

export const getAdminHeroMedia = cache(async (): Promise<AdminHeroItem[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hero_media")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      ...row,
      src: withCacheBust(
        getPublicStorageUrl(storageBuckets.hero, row.storage_path),
        row.updated_at,
      ),
      posterSrc: withCacheBust(
        getPublicStorageUrl(storageBuckets.hero, row.poster_storage_path),
        row.updated_at,
      ),
    }));
  } catch {
    return [];
  }
});
