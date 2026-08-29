import { createId } from "@/lib/id";

export const MENU_ITEM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const MENU_ITEM_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export const MENU_ITEM_IMAGE_ACCEPT = MENU_ITEM_IMAGE_MIME_TYPES.join(",");

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

const MENU_ITEM_PATH_RE =
  /^items\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif|gif)$/i;

const PRICE_RE = /^\d+(\.\d{1,2})?$/;
const PRICE_MAX = 99_999_999.99;

export type MenuItemFieldErrors = Partial<
  Record<"name" | "price" | "categoryId" | "file" | "storagePath", string>
>;

export type MenuItemMetadataInput = {
  name: string;
  shortDescription: string;
  price: string;
  categoryId: string;
};

function isMenuItemImageMime(
  value: string,
): value is (typeof MENU_ITEM_IMAGE_MIME_TYPES)[number] {
  return MENU_ITEM_IMAGE_MIME_TYPES.includes(
    value as (typeof MENU_ITEM_IMAGE_MIME_TYPES)[number],
  );
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveMenuItemImageMime(
  file: Pick<File, "type" | "name">,
): string | null {
  const raw = file.type.trim().toLowerCase();
  const aliased = MIME_ALIASES[raw] ?? raw;
  if (isMenuItemImageMime(aliased)) {
    return aliased;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) {
    return null;
  }

  return EXT_TO_MIME[ext] ?? null;
}

export function menuItemImageExtensionForMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}

export function buildMenuItemImagePath(mime: string): string | null {
  const ext = menuItemImageExtensionForMime(mime);
  if (!ext) {
    return null;
  }

  return `items/${createId()}.${ext}`;
}

export function isMenuItemImagePath(path: string): boolean {
  return MENU_ITEM_PATH_RE.test(path);
}

export function validateMenuItemImageFile(file: File): string | null {
  if (!resolveMenuItemImageMime(file)) {
    return "סוג הקובץ אינו נתמך. השתמשו ב-JPG, PNG, WebP, AVIF או GIF";
  }

  if (file.size > MENU_ITEM_IMAGE_MAX_BYTES) {
    return "הקובץ גדול מדי. הגודל המרבי הוא 5MB";
  }

  return null;
}

export function parsePrice(raw: string): { value: number } | { error: string } {
  const normalized = raw
    .trim()
    .replace(/₪/g, "")
    .replace(/,/g, ".")
    .replace(/\s/g, "");
  if (!normalized) {
    return { error: "יש להזין מחיר" };
  }

  if (!PRICE_RE.test(normalized)) {
    return {
      error: "המחיר חייב להיות מספר שאינו שלילי, עד שתי ספרות אחרי הנקודה",
    };
  }

  const value = Math.round(Number(normalized) * 100) / 100;
  if (!Number.isFinite(value) || value < 0) {
    return { error: "המחיר חייב להיות מספר שאינו שלילי" };
  }

  if (value > PRICE_MAX) {
    return { error: "המחיר גדול מדי" };
  }

  return { value };
}

export function formatPriceInput(value: number | string | null): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) {
    return "";
  }

  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export function parseCategoryId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export function validateMenuItemMetadata(
  input: MenuItemMetadataInput,
): MenuItemFieldErrors {
  const errors: MenuItemFieldErrors = {};

  if (!input.name.trim()) {
    errors.name = "שם המנה הוא שדה חובה";
  }

  if (!parseCategoryId(input.categoryId)) {
    errors.categoryId = "יש לבחור קטגוריה";
  }

  const price = parsePrice(input.price);
  if ("error" in price) {
    errors.price = price.error;
  }

  return errors;
}
