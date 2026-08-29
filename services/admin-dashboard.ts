import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { createClient } from "@/lib/supabase/server";

export type AdminShellContext = {
  restaurantName: string | null;
};

export type AdminDashboardSnapshot = {
  restaurantName: string | null;
  profileExists: boolean;
  isActive: boolean | null;
  categoryCount: number;
  menuItemCount: number;
  unavailableItemCount: number;
  visibleHeroCount: number;
  openingHoursRowCount: number;
};

const emptySnapshot: AdminDashboardSnapshot = {
  restaurantName: null,
  profileExists: false,
  isActive: null,
  categoryCount: 0,
  menuItemCount: 0,
  unavailableItemCount: 0,
  visibleHeroCount: 0,
  openingHoursRowCount: 0,
};

async function counted(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  const { count, error } = await query;
  if (error) {
    return 0;
  }
  return count ?? 0;
}

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
      const [
        profileResult,
        categoryCount,
        menuItemCount,
        unavailableItemCount,
        visibleHeroCount,
        openingHoursRowCount,
      ] = await Promise.all([
        supabase
          .from("restaurant_profile")
          .select("name, is_active")
          .maybeSingle(),
        counted(
          supabase
            .from("categories")
            .select("*", { count: "exact", head: true }),
        ),
        counted(
          supabase
            .from("menu_items")
            .select("*", { count: "exact", head: true }),
        ),
        counted(
          supabase
            .from("menu_items")
            .select("*", { count: "exact", head: true })
            .eq("is_available", false),
        ),
        counted(
          supabase
            .from("hero_media")
            .select("*", { count: "exact", head: true })
            .eq("is_visible", true),
        ),
        counted(
          supabase
            .from("opening_hours")
            .select("*", { count: "exact", head: true }),
        ),
      ]);

      const profile = profileResult.error ? null : profileResult.data;

      return {
        restaurantName: profile?.name?.trim() || null,
        profileExists: Boolean(profile),
        isActive: profile?.is_active ?? null,
        categoryCount,
        menuItemCount,
        unavailableItemCount,
        visibleHeroCount,
        openingHoursRowCount,
      };
    } catch {
      return emptySnapshot;
    }
  },
);
