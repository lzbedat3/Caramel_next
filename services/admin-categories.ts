import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { storageBuckets } from "@/config/storage";
import { getPublicStorageUrl, withCacheBust } from "@/lib/storage-url";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminCategory = Tables<"categories"> & {
  imageSrc: string | null;
  itemCount: number;
};

export const getAdminCategories = cache(async (): Promise<AdminCategory[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const [categoriesResult, itemsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
      supabase.from("menu_items").select("category_id"),
    ]);

    if (categoriesResult.error || !categoriesResult.data) {
      return [];
    }

    const counts = new Map<number, number>();
    for (const row of itemsResult.data ?? []) {
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    }

    return categoriesResult.data.map((row) => ({
      ...row,
      imageSrc: withCacheBust(
        getPublicStorageUrl(storageBuckets.categories, row.storage_path),
        row.updated_at,
      ),
      itemCount: counts.get(row.id) ?? 0,
    }));
  } catch {
    return [];
  }
});
