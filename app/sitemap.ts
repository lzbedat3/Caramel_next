import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getPublicSeoContent } from "@/services/public-seo";

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

    return [
      {
        url: siteConfig.url,
        lastModified,
        changeFrequency: "weekly",
        priority: 1,
      },
    ];
  } catch {
    return [
      {
        url: siteConfig.url,
        changeFrequency: "weekly",
        priority: 1,
      },
    ];
  }
}
