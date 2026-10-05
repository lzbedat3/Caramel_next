import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { Locale } from "@/config/locales";
import { siteConfig } from "@/config/site";
import { LocationChooser } from "@/features/pour/location-chooser";
import { PourMenu } from "@/features/pour/pour-menu";
import { SiteJsonLd } from "@/features/public/seo/restaurant-json-ld";
import { buildPublicMetadata } from "@/lib/seo";
import { getPublicHomeContent } from "@/services/public-home";
import { getPublicSeoContent } from "@/services/public-seo";

// The public menu in one language, at one branch. Every menu page renders this.
export async function menuRouteMetadata(
  locale: Locale,
  locationSlug: string | null = null,
): Promise<Metadata> {
  try {
    const seo = await getPublicSeoContent();
    return buildPublicMetadata(seo, locale, locationSlug);
  } catch {
    return {
      title: { absolute: siteConfig.nameLocalized },
      description: siteConfig.description,
      robots: { index: false, follow: false },
    };
  }
}

type MenuRouteProps = {
  locale: Locale;
  locationSlug?: string | null;
};

export async function MenuRoute({
  locale,
  locationSlug = null,
}: MenuRouteProps) {
  const [content, seo] = await Promise.all([
    getPublicHomeContent(locale, locationSlug),
    getPublicSeoContent(),
  ]);

  if (content.unknownLocation) {
    notFound();
  }

  // Several branches and none named in the address: the guest picks one.
  if (content.profile && !content.location && content.locations.length > 1) {
    return <LocationChooser locale={locale} content={content} />;
  }

  return (
    <>
      <SiteJsonLd
        seo={seo}
        locale={locale}
        locationSlug={content.location?.slug ?? null}
        categories={content.categories}
        menuItems={content.menuItems}
      />
      <PourMenu locale={locale} {...content} />
    </>
  );
}
