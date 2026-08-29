export const LOGO_MAX_BYTES = 5 * 1024 * 1024;

export const LOGO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
] as const;

export const LOGO_ACCEPT = LOGO_MIME_TYPES.join(",");

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
};

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const WAZE_RE = /^(https?:\/\/|waze:\/\/)/i;

export type ProfileInput = {
  name: string;
  subtitle: string;
  about: string;
  address: string;
  wazeUrl: string;
  phone: string;
  email: string;
  isActive: boolean;
};

export type ProfileFieldErrors = Partial<
  Record<keyof ProfileInput | "logo", string>
>;

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function profileInputFromRow(row: {
  name: string;
  subtitle: string | null;
  about: string | null;
  address: string | null;
  waze_url: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
} | null): ProfileInput {
  return {
    name: row?.name ?? "",
    subtitle: row?.subtitle ?? "",
    about: row?.about ?? "",
    address: row?.address ?? "",
    wazeUrl: row?.waze_url ?? "",
    phone: row?.phone ?? "",
    email: row?.email ?? "",
    isActive: row?.is_active ?? true,
  };
}

export function resolveLogoMime(file: Pick<File, "type" | "name">): string | null {
  const raw = file.type.trim().toLowerCase();
  const aliased = MIME_ALIASES[raw] ?? raw;
  if (LOGO_MIME_TYPES.includes(aliased as (typeof LOGO_MIME_TYPES)[number])) {
    return aliased;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) {
    return null;
  }

  return EXT_TO_MIME[ext] ?? null;
}

export function logoExtensionForMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}

export function logoStoragePathForMime(mime: string): string | null {
  const ext = logoExtensionForMime(mime);
  return ext ? `logo.${ext}` : null;
}

export function validateProfileInput(input: ProfileInput): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  if (!input.name.trim()) {
    errors.name = "שם המסעדה הוא שדה חובה";
  }

  const email = emptyToNull(input.email);
  if (email && !EMAIL_RE.test(email)) {
    errors.email = "כתובת האימייל אינה תקינה";
  }

  const wazeUrl = emptyToNull(input.wazeUrl);
  if (wazeUrl && !WAZE_RE.test(wazeUrl)) {
    errors.wazeUrl = "קישור Waze חייב להתחיל ב-https:// או waze://";
  }

  return errors;
}

export function validateLogoFile(file: File): string | null {
  if (!resolveLogoMime(file)) {
    return "סוג הקובץ אינו נתמך. השתמשו ב-JPG, PNG, WebP, AVIF, GIF או SVG";
  }

  if (file.size > LOGO_MAX_BYTES) {
    return "הקובץ גדול מדי. הגודל המרבי הוא 5MB";
  }

  return null;
}
