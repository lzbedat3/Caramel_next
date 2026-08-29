import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { PublicHome } from "@/features/public/public-home";
import { RestaurantJsonLd } from "@/features/public/seo/restaurant-json-ld";
import { parseCategoryParam } from "@/lib/category-nav";
import { buildPublicMetadata } from "@/lib/seo";
import { getPublicHomeContent } from "@/services/public-home";
import { getPublicSeoContent } from "@/services/public-seo";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

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

export default async function HomePage({ searchParams }: HomePageProps) {
  const [params, content, seo] = await Promise.all([
    searchParams,
    getPublicHomeContent(),
    getPublicSeoContent(),
  ]);

  return (
    <>
      <RestaurantJsonLd {...seo} />
      <PublicHome
        {...content}
        selectedCategory={parseCategoryParam(params.category)}
      />
    </>
  );
}
