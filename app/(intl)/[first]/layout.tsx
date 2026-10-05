import { RootDocument } from "@/components/layout/root-document";
import { PwaExperience } from "@/components/pwa/pwa-experience";
import { defaultLocale, isLocale, locales } from "@/config/locales";
import { RememberLanguage } from "@/features/pour/remember-language";
import { rootMetadata, rootViewport } from "@/lib/root-metadata";
import { getPublicLocationSlugs } from "@/services/public-seo";

import "@/styles/pour.css";

export const metadata = rootMetadata;
export const viewport = rootViewport;

// The first part of the address is either another language ("/ar") or a
// branch in the default language ("/akko"). Both are prerendered; a branch
// added later is rendered on its first visit.
export async function generateStaticParams() {
  const languages = locales.filter((locale) => locale !== defaultLocale);
  return [...languages, ...(await getPublicLocationSlugs())].map((first) => ({
    first,
  }));
}

// Root layout for these pages, so <html> carries the right language and
// direction. The page decides whether the address exists.
export default async function FirstSegmentLayout({
  children,
  params,
}: LayoutProps<"/[first]">) {
  const { first } = await params;
  const locale = isLocale(first) ? first : defaultLocale;

  return (
    <RootDocument locale={locale}>
      {locale === defaultLocale ? <RememberLanguage /> : null}
      {children}
      <PwaExperience locale={locale} />
    </RootDocument>
  );
}
