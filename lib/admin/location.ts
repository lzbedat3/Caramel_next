// The slug is the branch's permanent public path and what its QR code holds.
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const LOCATION_SLUG_MAX_LENGTH = 40;

// Words the site already uses as the first part of an address.
const RESERVED_SLUGS = ["he", "ar", "en", "admin", "portal", "auth", "api"];

export type LocationFieldErrors = Partial<
  Record<"name" | "slug" | "wazeUrl", string>
>;

/** Turns what was typed into the shape a slug takes: "Kiryat Ata" -> "kiryat-ata". */
export function normalizeLocationSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateLocationSlug(slug: string): string | null {
  if (!slug) {
    return "יש להזין כתובת באותיות אנגליות, למשל akko";
  }
  if (!SLUG_RE.test(slug) || slug.length > LOCATION_SLUG_MAX_LENGTH) {
    return "רק אותיות אנגליות קטנות, ספרות ומקפים";
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return "הכתובת הזו שמורה לאתר. בחרו כתובת אחרת";
  }
  return null;
}

export function normalizeWazeUrl(raw: string): string | null | "invalid" {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : "invalid";
  } catch {
    return "invalid";
  }
}
