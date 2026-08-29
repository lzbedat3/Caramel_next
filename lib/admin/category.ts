import { createId } from "@/lib/id";

export const CATEGORY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const CATEGORY_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export const CATEGORY_IMAGE_ACCEPT = CATEGORY_IMAGE_MIME_TYPES.join(",");

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
};

const CATEGORY_PATH_RE =
  /^categories\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif|gif)$/i;

export type CategoryFieldErrors = Partial<Record<"name" | "file" | "storagePath", string>>;

export type CategoryMetadataInput = {
  name: string;
  subtitle: string;
};

function isCategoryImageMime(
  value: string,
): value is (typeof CATEGORY_IMAGE_MIME_TYPES)[number] {
  return CATEGORY_IMAGE_MIME_TYPES.includes(
    value as (typeof CATEGORY_IMAGE_MIME_TYPES)[number],
  );
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveCategoryImageMime(
  file: Pick<File, "type" | "name">,
): string | null {
  const raw = file.type.trim().toLowerCase();
  const aliased = MIME_ALIASES[raw] ?? raw;
  if (isCategoryImageMime(aliased)) {
    return aliased;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) {
    return null;
  }

  return EXT_TO_MIME[ext] ?? null;
}

export function categoryImageExtensionForMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}

export function buildCategoryImagePath(mime: string): string | null {
  const ext = categoryImageExtensionForMime(mime);
  if (!ext) {
    return null;
  }

  return `categories/${createId()}.${ext}`;
}

export function isCategoryImagePath(path: string): boolean {
  return CATEGORY_PATH_RE.test(path);
}

export function validateCategoryImageFile(file: File): string | null {
  if (!resolveCategoryImageMime(file)) {
    return "סוג הקובץ אינו נתמך. השתמשו ב-JPG, PNG, WebP, AVIF או GIF";
  }

  if (file.size > CATEGORY_IMAGE_MAX_BYTES) {
    return "הקובץ גדול מדי. הגודל המרבי הוא 5MB";
  }

  return null;
}

export function validateCategoryMetadata(
  input: CategoryMetadataInput,
): CategoryFieldErrors {
  const errors: CategoryFieldErrors = {};
  if (!input.name.trim()) {
    errors.name = "שם הקטגוריה הוא שדה חובה";
  }
  return errors;
}
