import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { WEEKDAYS, type OpeningHour } from "@/lib/opening-hours";
import { createClient } from "@/lib/supabase/server";

export type AdminOpeningHour = OpeningHour;

function sortHours(rows: OpeningHour[]): OpeningHour[] {
  return [...rows].sort((a, b) => {
    const dayDiff =
      WEEKDAYS.indexOf(a.day_of_week) - WEEKDAYS.indexOf(b.day_of_week);
    if (dayDiff !== 0) {
      return dayDiff;
    }

    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }

    return a.id - b.id;
  });
}

export const getAdminHours = cache(async (): Promise<AdminOpeningHour[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("opening_hours")
      .select("*")
      .order("day_of_week", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error || !data) {
      return [];
    }

    return sortHours(data);
  } catch {
    return [];
  }
});
