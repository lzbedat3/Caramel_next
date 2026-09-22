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
  appleWebApp: { capable: true, title: "Caramel", statusBarStyle: "default" },
  icons: {
    icon: [
      {
        url: "/Caramel_Assets/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/Caramel_Assets/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
    ],
    apple: [{ url: "/Caramel_Assets/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    images: [
      {
        url: "/Caramel_Assets/social-preview-v1.png",
        width: 1200,
        height: 630,
        alt: "Caramel — גן עדן לציליאקים",
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
    images: ["/Caramel_Assets/social-preview-v1.png"],
    title: siteConfig.nameLocalized,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
