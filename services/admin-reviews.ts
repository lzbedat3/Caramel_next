import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminReview = Tables<"reviews"> & { locationName: string | null };

// Every review, hidden ones included, newest first.
export const getAdminReviews = cache(async (): Promise<AdminReview[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const [reviewsResult, locationsResult] = await Promise.all([
      supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("locations").select("id, name"),
    ]);
    if (reviewsResult.error || !reviewsResult.data) {
      return [];
    }

    const names = new Map(
      (locationsResult.data ?? []).map((row) => [row.id, row.name]),
    );
    return reviewsResult.data.map((row) => ({
      ...row,
      locationName: row.location_id
        ? (names.get(row.location_id) ?? null)
        : null,
    }));
  } catch {
    return [];
  }
});
