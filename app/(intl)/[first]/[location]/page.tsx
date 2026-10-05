import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { defaultLocale, isLocale, locales } from "@/config/locales";
import { MenuRoute, menuRouteMetadata } from "@/features/pour/menu-route";
import { getPublicLocationSlugs } from "@/services/public-seo";

export const revalidate = 3600;

type BranchPageProps = PageProps<"/[first]/[location]">;

// A branch in another language: "/ar/akko".
export async function generateStaticParams() {
  const slugs = await getPublicLocationSlugs();
  return locales
    .filter((locale) => locale !== defaultLocale)
    .flatMap((first) => slugs.map((location) => ({ first, location })));
}

export async function generateMetadata({
  params,
}: BranchPageProps): Promise<Metadata> {
  const { first, location } = await params;
  return isLocale(first) && first !== defaultLocale
    ? menuRouteMetadata(first, location)
    : {};
}

export default async function BranchPage({ params }: BranchPageProps) {
  const { first, location } = await params;
  if (!isLocale(first) || first === defaultLocale) {
    notFound();
  }

  return <MenuRoute locale={first} locationSlug={location} />;
}
