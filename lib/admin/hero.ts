import { createId } from "@/lib/id";

export const HERO_MAX_BYTES = 50 * 1024 * 1024;

export const HERO_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export const HERO_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const HERO_MIME_TYPES = [
  ...HERO_IMAGE_MIME_TYPES,
  ...HERO_VIDEO_MIME_TYPES,
] as const;

export const HERO_ACCEPT = HERO_MIME_TYPES.join(",");

export type HeroMediaType = "image" | "video";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
};

const HERO_PATH_RE =
  /^slides\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif|gif|mp4|webm|mov)$/i;

export type HeroFieldErrors = Partial<
  Record<"file" | "alt" | "duration" | "storagePath", string>
>;

export type HeroMetadataInput = {
  altText: string;
  duration: string;
  isVisible: boolean;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
};

function isHeroMime(
  value: string,
): value is (typeof HERO_MIME_TYPES)[number] {
  return HERO_MIME_TYPES.includes(value as (typeof HERO_MIME_TYPES)[number]);
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveHeroMime(
  file: Pick<File, "type" | "name">,
): string | null {
  const raw = file.type.trim().toLowerCase();
  const aliased = MIME_ALIASES[raw] ?? raw;
  if (isHeroMime(aliased)) {
    return aliased;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) {
    return null;
  }

  return EXT_TO_MIME[ext] ?? null;
}

export function heroExtensionForMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}

export function heroMediaTypeFromMime(mime: string): HeroMediaType | null {
  if (
    HERO_IMAGE_MIME_TYPES.includes(
      mime as (typeof HERO_IMAGE_MIME_TYPES)[number],
    )
  ) {
    return "image";
  }

  if (
    HERO_VIDEO_MIME_TYPES.includes(
      mime as (typeof HERO_VIDEO_MIME_TYPES)[number],
    )
  ) {
    return "video";
  }

  return null;
}

export function heroMediaTypeFromPath(path: string): HeroMediaType | null {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) {
    return null;
  }

  const mime = EXT_TO_MIME[ext];
  return mime ? heroMediaTypeFromMime(mime) : null;
}

export function buildHeroStoragePath(mime: string): string | null {
  const ext = heroExtensionForMime(mime);
  if (!ext) {
    return null;
  }

  return `slides/${createId()}.${ext}`;
}

export function isHeroStoragePath(path: string): boolean {
  return HERO_PATH_RE.test(path);
}

export function validateHeroFile(file: File): string | null {
  if (!resolveHeroMime(file)) {
    return "סוג הקובץ אינו נתמך. השתמשו בתמונה או בסרטון מהרשימה המותרת";
  }

  if (file.size > HERO_MAX_BYTES) {
    return "הקובץ גדול מדי. הגודל המרבי הוא 50MB";
  }

  return null;
}

export function parseDurationSeconds(
  raw: string,
): { value: number | null } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { value: null };
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return { error: "משך התצוגה חייב להיות מספר חיובי, או ריק" };
  }

  return { value };
}

export function validateHeroMetadata(
  input: HeroMetadataInput,
): HeroFieldErrors {
  const errors: HeroFieldErrors = {};
  const duration = parseDurationSeconds(input.duration);
  if ("error" in duration) {
    errors.duration = duration.error;
  }
  return errors;
}

export function durationInputValue(
  durationSeconds: number | string | null,
): string {
  if (durationSeconds === null || durationSeconds === undefined) {
    return "";
  }

  return String(durationSeconds);
}
