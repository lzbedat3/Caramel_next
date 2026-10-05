import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { defaultLocale, type Locale } from "@/config/locales";
import { storageBuckets } from "@/config/storage";
import { getHeroSlideDurationMs } from "@/lib/opening-hours";
import type { PublicCategory, PublicMenuItem } from "@/lib/public-content";
import type { PublicSocialLink } from "@/lib/social";
import { getPublicStorageUrl, withCacheBust } from "@/lib/storage-url";
import { emptyReviews, type PublicReviews } from "@/lib/reviews";
import { createPublicClient } from "@/lib/supabase/public";
import { localizedText, localizeProfile } from "@/lib/translations";
import { getPublicSeoContent } from "@/services/public-seo";
import type { Tables } from "@/types/database";

export type { PublicCategory, PublicMenuItem } from "@/lib/public-content";

export type HeroSlide = {
  id: number;
  type: Tables<"hero_media">["type"];
  src: string;
  alt: string | null;
  posterSrc: string | null;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  durationMs: number;
};

export type PublicHomeContent = {
  profile: Tables<"restaurant_profile"> | null;
  hours: Tables<"opening_hours">[];
  heroSlides: HeroSlide[];
  logoSrc: string | null;
  categories: PublicCategory[];
  menuItems: PublicMenuItem[];
  socialLinks: PublicSocialLink[];
  footer: PublicFooter;
  /** The branch this menu is for; null when the guest still has to choose one. */
  location: PublicLocation | null;
  /** Every active branch, for the chooser and the "other branches" links. */
  locations: PublicLocation[];
  /** The address named a branch that does not exist (or is switched off). */
  unknownLocation: boolean;
  reviews: PublicReviews;
};

// A branch in one language.
export type PublicLocation = {
  id: number;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
  wazeUrl: string | null;
  hours: Tables<"opening_hours">[];
};

// The credit and dedication under the menu, in one language. Empty hides a line.
export type PublicFooter = {
  creditName: string | null;
  creditUrl: string | null;
  dedicationBy: string | null;
  dedicationTo: string | null;
};

const emptyFooter: PublicFooter = {
  creditName: null,
  creditUrl: null,
  dedicationBy: null,
  dedicationTo: null,
};

const emptyContent: PublicHomeContent = {
  profile: null,
  hours: [],
  heroSlides: [],
  logoSrc: null,
  categories: [],
  menuItems: [],
  socialLinks: [],
  footer: emptyFooter,
  location: null,
  locations: [],
  unknownLocation: false,
  reviews: emptyReviews,
};

function toHeroSlide(row: Tables<"hero_media">): HeroSlide | null {
  const src = getPublicStorageUrl(storageBuckets.hero, row.storage_path);
  if (!src) {
    return null;
  }

  return {
    id: row.id,
    type: row.type,
    src: withCacheBust(src, row.updated_at) ?? src,
    alt: row.alt_text,
    posterSrc: withCacheBust(
      getPublicStorageUrl(storageBuckets.hero, row.poster_storage_path),
      row.updated_at,
    ),
    autoplay: row.autoplay,
    loop: row.loop,
    muted: row.muted,
    durationMs: getHeroSlideDurationMs(row.duration_seconds, row.type),
  };
}

function toPublicMenuItem(
  row: Tables<"menu_items">,
  locale: Locale,
): PublicMenuItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: localizedText(row, "name", locale) ?? row.name,
    shortDescription: localizedText(row, "short_description", locale),
    price: Number(row.price),
    imageSrc: withCacheBust(
      getPublicStorageUrl(storageBuckets.menuItems, row.storage_path),
      row.updated_at,
    ),
    isAvailable: row.is_available,
  };
}

function toPublicCategory(
  row: Tables<"categories">,
  locale: Locale,
): PublicCategory {
  return {
    id: row.id,
    name: localizedText(row, "name", locale) ?? row.name,
    subtitle: localizedText(row, "subtitle", locale),
    imageSrc: withCacheBust(
      getPublicStorageUrl(storageBuckets.categories, row.storage_path),
      row.updated_at,
    ),
  };
}

// Reviews are a side dish: if they cannot be read the menu is still served.
function toPublicReviews(
  ratings: { rating: number }[],
  latest: Pick<
    Tables<"reviews">,
    "id" | "name" | "rating" | "message" | "city" | "created_at" | "reply"
  >[],
): PublicReviews {
  if (ratings.length === 0) {
    return emptyReviews;
  }

  const sum = ratings.reduce((total, row) => total + row.rating, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
    latest: latest.map((row) => ({
      id: row.id,
      name: row.name,
      rating: row.rating,
      message: row.message,
      city: row.city,
      createdAt: row.created_at,
      reply: row.reply?.trim() || null,
    })),
  };
}

export const getPublicHomeContent = cache(
  async (
    locale: Locale = defaultLocale,
    locationSlug: string | null = null,
  ): Promise<PublicHomeContent> => {
    if (!isSupabaseConfigured()) {
      return emptyContent;
    }

    const supabase = createPublicClient();
    const [
      seo,
      heroResult,
      categoriesResult,
      menuItemsResult,
      ratingsResult,
      latestReviewsResult,
    ] = await Promise.all([
      getPublicSeoContent(),
      supabase
        .from("hero_media")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("categories")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("menu_items")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true }),
      // Every visible rating, for the average, and the newest reviews in full.
      supabase.from("reviews").select("rating").eq("is_visible", true),
      supabase
        .from("reviews")
        .select("id, name, rating, message, city, created_at, reply")
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    // See getPublicSeoContent: a failed read must not be cached as an empty menu.
    const failure =
      heroResult.error ?? categoriesResult.error ?? menuItemsResult.error;
    if (failure) {
      throw new Error(`Public content is unavailable: ${failure.message}`);
    }

    if (!seo.profile) {
      return emptyContent;
    }

    const locations: PublicLocation[] = seo.locations.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: localizedText(row, "name", locale) ?? row.name,
      address: localizedText(row, "address", locale),
      phone: row.phone?.trim() || null,
      wazeUrl: row.waze_url?.trim() || null,
      hours: seo.hours.filter((hour) => hour.location_id === row.id),
    }));
    // A named branch, or the only one there is. With several and none named,
    // the guest chooses.
    const location = locationSlug
      ? (locations.find((entry) => entry.slug === locationSlug) ?? null)
      : locations.length === 1
        ? (locations[0] ?? null)
        : null;

    const categories = (categoriesResult.data ?? []).map((row) =>
      toPublicCategory(row, locale),
    );
    const categoryIds = new Set(categories.map((category) => category.id));

    return {
      profile: localizeProfile(seo.profile, locale),
      hours: location?.hours ?? [],
      heroSlides: (heroResult.data ?? [])
        .map(toHeroSlide)
        .filter((slide): slide is HeroSlide => slide !== null),
      logoSrc: seo.logoSrc,
      categories,
      menuItems: (menuItemsResult.data ?? [])
        .filter((row) => categoryIds.has(row.category_id))
        .map((row) => toPublicMenuItem(row, locale)),
      socialLinks: seo.socialLinks,
      footer: seo.settings
        ? {
            creditName: seo.settings.credit_name?.trim() || null,
            creditUrl: seo.settings.credit_url?.trim() || null,
            dedicationBy: localizedText(seo.settings, "dedication_by", locale),
            dedicationTo: localizedText(seo.settings, "dedication_to", locale),
          }
        : emptyFooter,
      location,
      locations,
      unknownLocation: Boolean(locationSlug) && !location,
      reviews: toPublicReviews(
        ratingsResult.data ?? [],
        latestReviewsResult.data ?? [],
      ),
    };
  },
);
