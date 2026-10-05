import type { Metadata } from "next";

import { brandAssets } from "@/config/brand-assets";
import {
  defaultLocale,
  localeMeta,
  locales,
  type Locale,
} from "@/config/locales";
import { siteConfig } from "@/config/site";
import { getDictionary } from "@/lib/i18n";
import {
  formatClock,
  getOpenSlotsForDay,
  WEEKDAYS,
  type OpeningHour,
  type Weekday,
} from "@/lib/opening-hours";
import type { PublicCategory, PublicMenuItem } from "@/lib/public-content";
import type { PublicSocialLink } from "@/lib/social";
import { localizedText, localizeProfile } from "@/lib/translations";
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
  locations: Tables<"locations">[];
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

// The address of the menu in one language.
export function localeUrl(locale: Locale): string {
  return locale === defaultLocale
    ? siteConfig.url
    : `${siteConfig.url}/${locale}`;
}

// What search results show when the admin has not written a title or
// description: the name with what the place is, in the page's language.
export function derivedSeoTitle(
  profile: Tables<"restaurant_profile"> | null,
  locale: Locale = defaultLocale,
): string {
  const name =
    (profile ? localizeProfile(profile, locale).name.trim() : "") ||
    siteConfig.nameLocalized;
  return `${name} | ${getDictionary(locale).eyebrow}`;
}

export function derivedSeoDescription(
  _profile: Tables<"restaurant_profile"> | null,
  locale: Locale = defaultLocale,
): string {
  return getDictionary(locale).seoDescription;
}

export function resolvePublicSeo(
  input: PublicSeoInput,
  locale: Locale = defaultLocale,
): {
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

  // The admin's own title and description are written in the default language.
  const custom = locale === defaultLocale ? input.settings : null;
  const seoTitle = emptyToNull(custom?.seo_title ?? "");
  const seoDescription = emptyToNull(custom?.seo_description ?? "");

  return {
    title: seoTitle || derivedSeoTitle(input.profile, locale),
    description: seoDescription || derivedSeoDescription(input.profile, locale),
    isIndexable: true,
  };
}

// The branch a page is about: the one named in the address, or the only one.
export function resolveLocation(
  input: PublicSeoInput,
  locationSlug: string | null,
): Tables<"locations"> | null {
  if (locationSlug) {
    return input.locations.find((row) => row.slug === locationSlug) ?? null;
  }
  return input.locations.length === 1 ? (input.locations[0] ?? null) : null;
}

// The address search engines should keep for a page. A single branch is the
// same page as the home page, so it points there; with several, each branch
// has its own.
function pageUrl(
  input: PublicSeoInput,
  locale: Locale,
  location: Tables<"locations"> | null,
): string {
  return location && input.locations.length > 1
    ? `${localeUrl(locale)}/${location.slug}`
    : localeUrl(locale);
}

export function buildPublicMetadata(
  input: PublicSeoInput,
  locale: Locale = defaultLocale,
  locationSlug: string | null = null,
): Metadata {
  const resolved = resolvePublicSeo(input, locale);
  const { description, isIndexable } = resolved;
  const location = resolveLocation(input, locationSlug);
  const branch =
    location && input.locations.length > 1
      ? (localizedText(location, "name", locale) ?? location.name)
      : null;
  const title = branch ? `${branch} · ${resolved.title}` : resolved.title;
  const canonical = pageUrl(input, locale, location);
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
      languages: {
        ...Object.fromEntries(
          locales.map((entry) => [entry, pageUrl(input, entry, location)]),
        ),
        "x-default": pageUrl(input, defaultLocale, location),
      },
    },
    robots,
    openGraph: {
      type: "website",
      locale: localeMeta[locale].ogLocale,
      url: canonical,
      siteName: title,
      title,
      description,
      images: [
        {
          url: brandAssets.socialPreview,
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
          url: brandAssets.socialPreview,
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

export type SiteJsonLdInput = {
  seo: PublicSeoInput;
  locale: Locale;
  locationSlug?: string | null;
  categories: PublicCategory[];
  menuItems: PublicMenuItem[];
};

function menuJsonLd(
  categories: PublicCategory[],
  menuItems: PublicMenuItem[],
  url: string,
): JsonLdValue | undefined {
  const sections = categories
    .map((category) => ({
      "@type": "MenuSection",
      name: category.name,
      hasMenuItem: menuItems
        .filter((item) => item.categoryId === category.id)
        .map((item) =>
          compact({
            "@type": "MenuItem",
            name: item.name,
            description: item.shortDescription ?? undefined,
            offers: Number.isFinite(item.price)
              ? {
                  "@type": "Offer",
                  price: item.price,
                  priceCurrency: "ILS",
                }
              : undefined,
          }),
        ),
    }))
    .filter((section) => section.hasMenuItem.length > 0);

  if (sections.length === 0) {
    return undefined;
  }

  return { "@type": "Menu", url, hasMenuSection: sections };
}

// Two linked entries: the site (its name is what Google shows above the
// result, instead of the bare domain) and the business with its menu.
export function buildSiteJsonLd({
  seo,
  locale,
  locationSlug = null,
  categories,
  menuItems,
}: SiteJsonLdInput): Record<string, JsonLdValue> | null {
  const name = seo.profile?.name.trim();
  if (!seo.profile || !name) {
    return null;
  }
  const profile = localizeProfile(seo.profile, locale);

  const strings = getDictionary(locale);
  const location = resolveLocation(seo, locationSlug);
  const url = pageUrl(seo, locale, location);
  const home = localeUrl(defaultLocale);
  const { description } = resolvePublicSeo(seo, locale);
  const address = location ? localizedText(location, "address", locale) : null;
  const sameAs = seo.socialLinks
    .map((link) => link.url.trim())
    .filter((link) => link.length > 0);
  const hours = openingHoursSpec(
    location
      ? seo.hours.filter((hour) => hour.location_id === location.id)
      : [],
  );
  const logo = new URL(brandAssets.icon512, siteConfig.url).toString();

  return {
    "@context": "https://schema.org",
    "@graph": [
      compact({
        "@type": "WebSite",
        "@id": `${home}#website`,
        url: home,
        name,
        alternateName: [siteConfig.nameLocalized, siteConfig.name],
        inLanguage: [...locales],
      }),
      compact({
        "@type": "Bakery",
        "@id": `${home}#business`,
        name: profile.name.trim() || name,
        alternateName: [siteConfig.nameLocalized, siteConfig.name],
        slogan: strings.eyebrow,
        description,
        url,
        telephone: location?.phone?.trim() || undefined,
        email: profile.email?.trim() || undefined,
        image: seo.logoSrc ?? logo,
        logo,
        servesCuisine: ["Gluten-free", "Desserts", "Bakery"],
        address: address
          ? compact({
              "@type": "PostalAddress",
              streetAddress: address,
              addressCountry: "IL",
            })
          : undefined,
        hasMap: location?.waze_url?.trim() || undefined,
        openingHoursSpecification: hours.length > 0 ? hours : undefined,
        hasMenu: menuJsonLd(categories, menuItems, url),
        sameAs: sameAs.length > 0 ? sameAs : undefined,
      }),
    ],
  };
}

export function serializeJsonLd(data: Record<string, JsonLdValue>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
