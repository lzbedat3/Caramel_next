import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { storageBuckets } from "@/config/storage";
import type { OpeningHour } from "@/lib/opening-hours";
import type { PublicSocialLink } from "@/lib/social";
import { getPublicStorageUrl, withCacheBust } from "@/lib/storage-url";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type PublicSiteSettings = Pick<
  Tables<"site_settings">,
  "seo_title" | "seo_description"
>;

export type PublicSeoContent = {
  profile: Tables<"restaurant_profile"> | null;
  settings: PublicSiteSettings | null;
  hours: OpeningHour[];
  socialLinks: PublicSocialLink[];
  logoSrc: string | null;
};

const emptySeoContent: PublicSeoContent = {
  profile: null,
  settings: null,
  hours: [],
  socialLinks: [],
  logoSrc: null,
};

export const getPublicSeoContent = cache(
  async (): Promise<PublicSeoContent> => {
    if (!isSupabaseConfigured()) {
      return emptySeoContent;
    }

    try {
      const supabase = await createClient();
      const [profileResult, hoursResult, socialResult, settingsResult] =
        await Promise.all([
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
            .select("seo_title, seo_description")
            .eq("id", 1)
            .maybeSingle(),
        ]);

      if (profileResult.error) {
        return emptySeoContent;
      }

      const profile = profileResult.data;
      if (!profile) {
        return emptySeoContent;
      }

      return {
        profile,
        settings: settingsResult.error ? null : (settingsResult.data ?? null),
        hours: hoursResult.error ? [] : (hoursResult.data ?? []),
        socialLinks: socialResult.error ? [] : (socialResult.data ?? []),
        logoSrc: withCacheBust(
          getPublicStorageUrl(
            storageBuckets.branding,
            profile.logo_storage_path,
          ),
          profile.updated_at,
        ),
      };
    } catch {
      return emptySeoContent;
    }
  },
);
