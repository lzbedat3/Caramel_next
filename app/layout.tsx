import type { Metadata, Viewport } from "next";

import { siteConfig } from "@/config/site";
import { fontHtmlClassName } from "@/lib/fonts";

import "@/styles/globals.css";

function metadataBaseUrl(): URL {
  try {
    return new URL(siteConfig.url);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: siteConfig.nameLocalized,
    template: `%s | ${siteConfig.nameLocalized}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.nameLocalized,
    title: siteConfig.nameLocalized,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.nameLocalized,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#f07a12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={siteConfig.locale}
      dir={siteConfig.dir}
      className={`${fontHtmlClassName} min-h-dvh antialiased`}
    >
      <body className="flex min-h-dvh flex-col font-sans">{children}</body>
    </html>
  );
}
