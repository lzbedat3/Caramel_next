const FALLBACK_SITE_URL = "http://localhost:3000";

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

    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${path}`;
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
    "האתר הציבורי של קרמל — תפריט, שעות וסיפור המסעדה. התוכן מגיע ממערכת הניהול.",
  url: getSiteUrl(),
} as const;

export type SiteDirection = typeof siteConfig.dir;
