export const locales = ["he", "ar", "en"] as const;

export type Locale = (typeof locales)[number];

// The language served at "/". The others live under "/<locale>".
export const defaultLocale: Locale = "he";

export const localeMeta: Record<
  Locale,
  { dir: "rtl" | "ltr"; ogLocale: string; label: string; short: string }
> = {
  he: { dir: "rtl", ogLocale: "he_IL", label: "עברית", short: "עב" },
  ar: { dir: "rtl", ogLocale: "ar_IL", label: "العربية", short: "ع" },
  en: { dir: "ltr", ogLocale: "en_US", label: "English", short: "EN" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function localePath(locale: Locale): string {
  return locale === defaultLocale ? "/" : `/${locale}`;
}

// The path of the menu in one language, optionally at one branch:
// "/", "/akko", "/ar", "/ar/akko".
export function menuPath(locale: Locale, locationSlug?: string | null): string {
  const parts = [
    ...(locale === defaultLocale ? [] : [locale]),
    ...(locationSlug ? [locationSlug] : []),
  ];
  return `/${parts.join("/")}`;
}

// Where the guest's chosen language is remembered in the browser.
export const LOCALE_STORAGE_KEY = "caramel-locale";
