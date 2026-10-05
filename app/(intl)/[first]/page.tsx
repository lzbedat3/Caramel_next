import type { Metadata } from "next";

import { defaultLocale, isLocale } from "@/config/locales";
import { MenuRoute, menuRouteMetadata } from "@/features/pour/menu-route";

export const revalidate = 3600;

type FirstPageProps = PageProps<"/[first]">;

// "/ar" is the menu in Arabic; "/akko" is the Akko branch in the default language.
function target(first: string) {
  return isLocale(first) && first !== defaultLocale
    ? { locale: first, locationSlug: null }
    : { locale: defaultLocale, locationSlug: first };
}

export async function generateMetadata({
  params,
}: FirstPageProps): Promise<Metadata> {
  const { locale, locationSlug } = target((await params).first);
  return menuRouteMetadata(locale, locationSlug);
}

export default async function FirstSegmentPage({ params }: FirstPageProps) {
  const { locale, locationSlug } = target((await params).first);
  return <MenuRoute locale={locale} locationSlug={locationSlug} />;
}
