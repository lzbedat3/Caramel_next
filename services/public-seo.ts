import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { storageBuckets } from "@/config/storage";
import type { OpeningHour } from "@/lib/opening-hours";
import type { PublicSocialLink } from "@/lib/social";
import { getPublicStorageUrl, withCacheBust } from "@/lib/storage-url";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/types/database";

const SETTINGS_COLUMNS =
  "seo_title, seo_description, credit_name, credit_url, dedication_by, dedication_by_ar, dedication_by_en, dedication_to, dedication_to_ar, dedication_to_en" as const;

export type PublicSiteSettings = Omit<
  Tables<"site_settings">,
  "id" | "created_at" | "updated_at"
>;

export type PublicSeoContent = {
  profile: Tables<"restaurant_profile"> | null;
  settings: PublicSiteSettings | null;
  hours: OpeningHour[];
  /** Active branches, in display order. */
  locations: Tables<"locations">[];
  socialLinks: PublicSocialLink[];
  logoSrc: string | null;
};

const emptySeoContent: PublicSeoContent = {
  profile: null,
  settings: null,
  hours: [],
  locations: [],
  socialLinks: [],
  logoSrc: null,
};

export const getPublicSeoContent = cache(
  async (): Promise<PublicSeoContent> => {
    if (!isSupabaseConfigured()) {
      return emptySeoContent;
    }

    const supabase = createPublicClient();
    const [
      profileResult,
      hoursResult,
      socialResult,
      settingsResult,
      locationsResult,
    ] = await Promise.all([
      supabase
        .from("restaurant_profile")
        .select("*")
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("opening_hours")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("social_links")
        .select("id, platform, url")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("site_settings")
        .select(SETTINGS_COLUMNS)
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("locations")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
    ]);

    // Public pages are cached. A failed read throws, so the last good copy
    // keeps being served instead of an empty one replacing it.
    const failure =
      profileResult.error ??
      hoursResult.error ??
      socialResult.error ??
      settingsResult.error ??
      locationsResult.error;
    if (failure) {
      throw new Error(`Public content is unavailable: ${failure.message}`);
    }

    const profile = profileResult.data;
    if (!profile) {
      return emptySeoContent;
    }

    return {
      profile,
      settings: settingsResult.data ?? null,
      hours: hoursResult.data ?? [],
      locations: locationsResult.data ?? [],
      socialLinks: socialResult.data ?? [],
      logoSrc: withCacheBust(
        getPublicStorageUrl(storageBuckets.branding, profile.logo_storage_path),
        profile.updated_at,
      ),
    };
  },
);

// The addresses of the active branches, for prerendering their pages. An
// unreachable database only means they are rendered on first visit instead.
export async function getPublicLocationSlugs(): Promise<string[]> {
  try {
    return (await getPublicSeoContent()).locations.map((row) => row.slug);
  } catch {
    return [];
  }
}
