import type { Metadata, Viewport } from "next";

import { brandAssets } from "@/config/brand-assets";
import { siteConfig } from "@/config/site";

function metadataBaseUrl(): URL {
  try {
    return new URL(siteConfig.url);
  } catch {
    return new URL("http://localhost:3000");
  }
}

// Shared by every root layout; pages refine the title, description and robots.
export const rootMetadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: siteConfig.nameLocalized,
    template: `%s | ${siteConfig.nameLocalized}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  appleWebApp: { capable: true, title: "Caramel", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: brandAssets.favicon32, sizes: "32x32", type: "image/png" },
      { url: brandAssets.favicon48, sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: brandAssets.appleTouchIcon, sizes: "180x180" }],
  },
  openGraph: {
    images: [
      {
        url: brandAssets.socialPreview,
        width: 1200,
        height: 630,
        alt: siteConfig.nameLocalized,
        type: "image/png",
      },
    ],
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.nameLocalized,
    title: siteConfig.nameLocalized,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    images: [brandAssets.socialPreview],
    title: siteConfig.nameLocalized,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const rootViewport: Viewport = {
  themeColor: "#0d0806",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
