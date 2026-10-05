import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { siteConfig } from "@/config/site";
import { isRestaurantOpen } from "@/lib/opening-hours";
import { createClient } from "@/lib/supabase/server";

export type AdminShellContext = {
  restaurantName: string | null;
};

export type AdminDashboardSnapshot = {
  restaurantName: string | null;
  profileExists: boolean;
  isActive: boolean | null;
  /** Open right now by the saved hours; null when no hours are saved. */
  isOpenNow: boolean | null;
  categoryCount: number;
  hiddenCategoryCount: number;
  menuItemCount: number;
  visibleItemCount: number;
  hiddenItemCount: number;
  unavailableItemCount: number;
  itemsWithoutImage: number;
  itemsMissingTranslation: number;
  openingHoursRowCount: number;
};

const emptySnapshot: AdminDashboardSnapshot = {
  restaurantName: null,
  profileExists: false,
  isActive: null,
  isOpenNow: null,
  categoryCount: 0,
  hiddenCategoryCount: 0,
  menuItemCount: 0,
  visibleItemCount: 0,
  hiddenItemCount: 0,
  unavailableItemCount: 0,
  itemsWithoutImage: 0,
  itemsMissingTranslation: 0,
  openingHoursRowCount: 0,
};

export const getAdminShellContext = cache(
  async (): Promise<AdminShellContext> => {
    if (!isSupabaseConfigured()) {
      return { restaurantName: null };
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("restaurant_profile")
        .select("name")
        .maybeSingle();

      if (error) {
        return { restaurantName: null };
      }

      return { restaurantName: data?.name?.trim() || null };
    } catch {
      return { restaurantName: null };
    }
  },
);

export const getAdminDashboardSnapshot = cache(
  async (): Promise<AdminDashboardSnapshot> => {
    if (!isSupabaseConfigured()) {
      return emptySnapshot;
    }

    try {
      const supabase = await createClient();
      const [profileResult, categoriesResult, itemsResult, hoursResult] =
        await Promise.all([
          supabase
            .from("restaurant_profile")
            .select("name, is_active")
            .maybeSingle(),
          supabase.from("categories").select("id, is_visible"),
          supabase
            .from("menu_items")
            .select(
              "id, is_visible, is_available, storage_path, name_ar, name_en",
            ),
          supabase.from("opening_hours").select("*"),
        ]);

      const profile = profileResult.error ? null : profileResult.data;
      const categories = categoriesResult.data ?? [];
      const items = itemsResult.data ?? [];
      const hours = hoursResult.data ?? [];
      const visibleItems = items.filter((item) => item.is_visible);

      return {
        restaurantName: profile?.name?.trim() || null,
        profileExists: Boolean(profile),
        isActive: profile?.is_active ?? null,
        isOpenNow:
          hours.length > 0
            ? isRestaurantOpen(hours, new Date(), siteConfig.timeZone)
            : null,
        categoryCount: categories.length,
        hiddenCategoryCount: categories.filter((row) => !row.is_visible).length,
        menuItemCount: items.length,
        visibleItemCount: visibleItems.length,
        hiddenItemCount: items.length - visibleItems.length,
        unavailableItemCount: items.filter((item) => !item.is_available).length,
        // Only what guests can see is worth chasing.
        itemsWithoutImage: visibleItems.filter((item) => !item.storage_path)
          .length,
        itemsMissingTranslation: visibleItems.filter(
          (item) => !item.name_ar?.trim() || !item.name_en?.trim(),
        ).length,
        openingHoursRowCount: hours.length,
      };
    } catch {
      return emptySnapshot;
    }
  },
);
