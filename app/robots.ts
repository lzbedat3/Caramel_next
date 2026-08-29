import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getPublicSeoContent } from "@/services/public-seo";

const adminAndAuthDisallow = ["/admin", "/admin/", "/auth", "/auth/"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  let isIndexable = true;

  try {
    const { profile } = await getPublicSeoContent();
    isIndexable = Boolean(profile);
  } catch {
    isIndexable = true;
  }

  if (!isIndexable) {
    return {
      host: siteConfig.url,
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    host: siteConfig.url,
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: adminAndAuthDisallow,
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
