export const WEB_IMAGE_CACHE_CONTROL = "31536000";
export const WEB_IMAGE_OUTPUT_MIME = "image/webp";
export const WEB_IMAGE_QUALITY = 78;

export const MENU_IMAGE_MAX_EDGE = 1200;
export const CATEGORY_IMAGE_MAX_EDGE = 960;
export const HERO_IMAGE_MAX_EDGE = 1920;
export const LOGO_IMAGE_MAX_EDGE = 800;

/** Already-web-sized files can skip another pass. */
export const COMPACT_SKIP_MAX_BYTES = 180 * 1024;

export const MENU_CARD_IMAGE_SIZES =
  "(min-width: 1280px) 16vw, (min-width: 1024px) 25vw, (min-width: 768px) 28vw, 42vw";

export const MENU_MODAL_IMAGE_SIZES = "(min-width: 640px) 26rem, 100vw";

/** Must match an entry in next.config images.deviceSizes / imageSizes. */
export const MENU_IMAGE_MAX_REQUEST_WIDTH = 828;

const SKIP_PREPARE_MIME = new Set(["image/gif", "image/svg+xml"]);

export function shouldPrepareImage(mime: string): boolean {
  return mime.startsWith("image/") && !SKIP_PREPARE_MIME.has(mime);
}
