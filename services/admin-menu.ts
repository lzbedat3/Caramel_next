import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { storageBuckets } from "@/config/storage";
import { getPublicStorageUrl, withCacheBust } from "@/lib/storage-url";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminMenuCategoryOption = {
  id: number;
  name: string;
  isVisible: boolean;
  sortOrder: number;
};

export type AdminMenuItem = Tables<"menu_items"> & {
  price: number;
  imageSrc: string | null;
  categoryName: string;
};

export type AdminMenuPayload = {
  categories: AdminMenuCategoryOption[];
  items: AdminMenuItem[];
};

const emptyPayload: AdminMenuPayload = {
  categories: [],
  items: [],
};

function toPrice(value: number | string): number {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export const getAdminMenu = cache(async (): Promise<AdminMenuPayload> => {
  if (!isSupabaseConfigured()) {
    return emptyPayload;
  }

  try {
    const supabase = await createClient();
    const [categoriesResult, itemsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, is_visible, sort_order")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
    ]);

    if (categoriesResult.error || itemsResult.error) {
      return emptyPayload;
    }

    const categories = (categoriesResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      isVisible: row.is_visible,
      sortOrder: row.sort_order,
    }));
    const names = new Map(categories.map((category) => [category.id, category.name]));

    return {
      categories,
      items: (itemsResult.data ?? []).map((row) => ({
        ...row,
        price: toPrice(row.price),
        imageSrc: withCacheBust(
          getPublicStorageUrl(storageBuckets.menuItems, row.storage_path),
          row.updated_at,
        ),
        categoryName: names.get(row.category_id) ?? "קטגוריה",
      })),
    };
  } catch {
    return emptyPayload;
  }
});
