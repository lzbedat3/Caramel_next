const FALLBACK_SITE_URL = "https://caramel.darb.co.il";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    return FALLBACK_SITE_URL;
  }

  try {
    const parsed = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return FALLBACK_SITE_URL;
    }

    // Never publish local development addresses to social crawlers in production.
    if (
      process.env.NODE_ENV === "production" &&
      ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(parsed.hostname)
    ) {
      return FALLBACK_SITE_URL;
    }
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${path}`;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

// The address guests reach the site at. Unlike siteConfig.url it never points
// at a development machine, so a QR code made locally is still printable.
export function getPublicSiteUrl(): string {
  const url = getSiteUrl();
  try {
    const { hostname } = new URL(url);
    const local =
      ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(hostname) ||
      /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(hostname);
    return local ? FALLBACK_SITE_URL : url;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const siteConfig = {
  name: "Caramel",
  nameLocalized: "קרמל",
  locale: "he",
  dir: "rtl" as const,
  timeZone: "Asia/Jerusalem",
  ogLocale: "he_IL",
  description:
    "קונדיטוריה בעבודת יד ללא גלוטן - התפריט של קרמל, שעות פתיחה ודרכי הגעה.",
  url: getSiteUrl(),
} as const;

export type SiteDirection = typeof siteConfig.dir;
