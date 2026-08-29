import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/config/env";
import { storageBuckets } from "@/config/storage";
import { getHeroSlideDurationMs } from "@/lib/opening-hours";
import type { PublicCategory, PublicMenuItem } from "@/lib/public-content";
import type { PublicSocialLink } from "@/lib/social";
import { getPublicStorageUrl, withCacheBust } from "@/lib/storage-url";
import { createClient } from "@/lib/supabase/server";
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
};

const emptyContent: PublicHomeContent = {
  profile: null,
  hours: [],
  heroSlides: [],
  logoSrc: null,
  categories: [],
  menuItems: [],
  socialLinks: [],
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

function toPublicMenuItem(row: Tables<"menu_items">): PublicMenuItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    shortDescription: row.short_description?.trim() || null,
    price: Number(row.price),
    imageSrc: withCacheBust(
      getPublicStorageUrl(storageBuckets.menuItems, row.storage_path),
      row.updated_at,
    ),
    isAvailable: row.is_available,
  };
}

function toPublicCategory(row: Tables<"categories">): PublicCategory {
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle?.trim() || null,
    imageSrc: withCacheBust(
      getPublicStorageUrl(storageBuckets.categories, row.storage_path),
      row.updated_at,
    ),
  };
}

export const getPublicHomeContent = cache(
  async (): Promise<PublicHomeContent> => {
    if (!isSupabaseConfigured()) {
      return emptyContent;
    }

    try {
      const supabase = await createClient();
      const [seo, heroResult, categoriesResult, menuItemsResult] =
        await Promise.all([
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
        ]);

      if (!seo.profile) {
        return emptyContent;
      }

      if (heroResult.error || categoriesResult.error) {
        return {
          ...emptyContent,
          profile: seo.profile,
          hours: seo.hours,
          logoSrc: seo.logoSrc,
          socialLinks: seo.socialLinks,
        };
      }

      const categories = (categoriesResult.data ?? []).map(toPublicCategory);
      const categoryIds = new Set(categories.map((category) => category.id));
      const menuItems = menuItemsResult.error
        ? []
        : (menuItemsResult.data ?? [])
            .filter((row) => categoryIds.has(row.category_id))
            .map(toPublicMenuItem);

      return {
        profile: seo.profile,
        hours: seo.hours,
        heroSlides: (heroResult.data ?? [])
          .map(toHeroSlide)
          .filter((slide): slide is HeroSlide => slide !== null),
        logoSrc: seo.logoSrc,
        categories,
        menuItems,
        socialLinks: seo.socialLinks,
      };
    } catch {
      return emptyContent;
    }
  },
);
