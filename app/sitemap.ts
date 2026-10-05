import type { MetadataRoute } from "next";

import { defaultLocale, locales } from "@/config/locales";
import { localeUrl } from "@/lib/seo";
import { getPublicSeoContent } from "@/services/public-seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { profile } = await getPublicSeoContent();
    if (!profile) {
      return [];
    }

    let lastModified: Date | undefined;
    if (profile.updated_at) {
      const parsed = new Date(profile.updated_at);
      if (!Number.isNaN(parsed.getTime())) {
        lastModified = parsed;
      }
    }

    const { locations } = await getPublicSeoContent();
    // With one branch its page is the home page; with several, each has its own.
    const paths = [
      "",
      ...(locations.length > 1 ? locations.map((row) => `/${row.slug}`) : []),
    ];

    return paths.flatMap((path) => {
      const languages = Object.fromEntries(
        locales.map((locale) => [locale, `${localeUrl(locale)}${path}`]),
      );
      return locales.map((locale) => ({
        url: `${localeUrl(locale)}${path}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: locale === defaultLocale ? 1 : 0.8,
        alternates: { languages },
      }));
    });
  } catch {
    return [
      {
        url: localeUrl(defaultLocale),
        changeFrequency: "weekly",
        priority: 1,
      },
    ];
  }
}
