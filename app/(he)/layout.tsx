import { RootDocument } from "@/components/layout/root-document";
import { defaultLocale } from "@/config/locales";
import { rootMetadata, rootViewport } from "@/lib/root-metadata";

export const metadata = rootMetadata;
export const viewport = rootViewport;

// Root layout for the default language: the Hebrew menu, the admin and sign-in.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootDocument locale={defaultLocale}>{children}</RootDocument>;
}
