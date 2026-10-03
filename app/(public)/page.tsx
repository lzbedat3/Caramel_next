import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { PourMenu } from "@/features/pour/pour-menu";
import { RestaurantJsonLd } from "@/features/public/seo/restaurant-json-ld";
import { buildPublicMetadata } from "@/lib/seo";
import { getPublicHomeContent } from "@/services/public-home";
import { getPublicSeoContent } from "@/services/public-seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getPublicSeoContent();
    return buildPublicMetadata(seo);
  } catch {
    return {
      title: { absolute: siteConfig.nameLocalized },
      description: siteConfig.description,
      robots: { index: false, follow: false },
    };
  }
}

export default async function HomePage() {
  const [content, seo] = await Promise.all([
    getPublicHomeContent(),
    getPublicSeoContent(),
  ]);

  return (
    <>
      <RestaurantJsonLd {...seo} />
      <PourMenu {...content} />
    </>
  );
}
