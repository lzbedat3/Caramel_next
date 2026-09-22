import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import {
  formatClock,
  getOpenSlotsForDay,
  WEEKDAYS,
  type OpeningHour,
  type Weekday,
} from "@/lib/opening-hours";
import type { PublicSocialLink } from "@/lib/social";
import type { Tables } from "@/types/database";

export const SEO_TITLE_MAX_LENGTH = 70;
export const SEO_DESCRIPTION_MAX_LENGTH = 320;

const SCHEMA_WEEKDAY: Record<Weekday, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export type SiteSettings = Tables<"site_settings">;

export type PublicSeoInput = {
  profile: Tables<"restaurant_profile"> | null;
  settings: Pick<SiteSettings, "seo_title" | "seo_description"> | null;
  hours: OpeningHour[];
  socialLinks: PublicSocialLink[];
  logoSrc: string | null;
};

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function clipMetaDescription(value: string, max = 160): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }

  const slice = normalized.slice(0, max - 1);
  const breakAt = slice.lastIndexOf(" ");
  return `${(breakAt > 80 ? slice.slice(0, breakAt) : slice).trimEnd()}…`;
}

export function derivedSeoTitle(
  profile: Tables<"restaurant_profile"> | null,
): string {
  return profile?.name?.trim() || siteConfig.nameLocalized;
}

export function derivedSeoDescription(
  profile: Tables<"restaurant_profile"> | null,
): string {
  const subtitle = profile?.subtitle?.trim();
  if (subtitle) {
    return clipMetaDescription(subtitle);
  }

  const about = profile?.about?.trim();
  if (about) {
    return clipMetaDescription(about);
  }

  return siteConfig.description;
}

export function resolvePublicSeo(input: PublicSeoInput): {
  title: string;
  description: string;
  isIndexable: boolean;
} {
  const isIndexable = Boolean(input.profile);
  if (!isIndexable) {
    return {
      title: siteConfig.nameLocalized,
      description: siteConfig.description,
      isIndexable: false,
    };
  }

  const seoTitle = emptyToNull(input.settings?.seo_title ?? "");
  const seoDescription = emptyToNull(input.settings?.seo_description ?? "");

  return {
    title: seoTitle || derivedSeoTitle(input.profile),
    description: seoDescription || derivedSeoDescription(input.profile),
    isIndexable: true,
  };
}

export function buildPublicMetadata(input: PublicSeoInput): Metadata {
  const { title, description, isIndexable } = resolvePublicSeo(input);
  const canonical = siteConfig.url;
  const ogImageAlt = title;
  const robots = isIndexable
    ? { index: true, follow: true }
    : { index: false, follow: false };

  return {
    title: { absolute: title },
    description,
    applicationName: title,
    alternates: {
      canonical,
    },
    robots,
    openGraph: {
      type: "website",
      locale: siteConfig.ogLocale,
      url: canonical,
      siteName: title,
      title,
      description,
      images: [
        {
          url: "/Caramel_Assets/social-preview-v1.png",
          type: "image/png",
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: "/Caramel_Assets/social-preview-v1.png",
          type: "image/png",
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
  };
}

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

function compact<T extends Record<string, JsonLdValue | undefined>>(
  value: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  const next: Record<string, JsonLdValue> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null || entry === "") {
      continue;
    }
    if (Array.isArray(entry) && entry.length === 0) {
      continue;
    }
    next[key] = entry;
  }
  return next as { [K in keyof T]: Exclude<T[K], undefined> };
}

function openingHoursSpec(hours: OpeningHour[]): JsonLdValue[] {
  const specs: JsonLdValue[] = [];

  for (const day of WEEKDAYS) {
    for (const row of getOpenSlotsForDay(hours, day)) {
      if (!row.opens_at || !row.closes_at) {
        continue;
      }

      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_WEEKDAY[day],
        opens: formatClock(row.opens_at),
        closes: formatClock(row.closes_at),
      });
    }
  }

  return specs;
}

export function buildRestaurantJsonLd(
  input: PublicSeoInput,
): Record<string, JsonLdValue> | null {
  if (!input.profile) {
    return null;
  }

  const name = input.profile.name.trim();
  if (!name) {
    return null;
  }

  const description =
    emptyToNull(input.settings?.seo_description ?? "") ||
    input.profile.about?.trim() ||
    input.profile.subtitle?.trim() ||
    null;
  const address = input.profile.address?.trim() || null;
  const telephone = input.profile.phone?.trim() || null;
  const email = input.profile.email?.trim() || null;
  const logo = input.logoSrc;
  const sameAs = input.socialLinks
    .map((link) => link.url.trim())
    .filter((url) => url.length > 0);
  const hours = openingHoursSpec(input.hours);

  return compact({
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name,
    description: description ?? undefined,
    url: siteConfig.url,
    telephone: telephone ?? undefined,
    email: email ?? undefined,
    image: logo ?? undefined,
    logo: logo ?? undefined,
    address: address
      ? compact({
          "@type": "PostalAddress",
          streetAddress: address,
        })
      : undefined,
    openingHoursSpecification: hours.length > 0 ? hours : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  });
}

export function serializeJsonLd(data: Record<string, JsonLdValue>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
