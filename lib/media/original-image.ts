// The optimiser refuses new images (402) once the hosting plan's monthly
// allowance is spent. The stored original is then shown instead of a broken
// picture, so the menu never depends on that allowance.
export function originalSource(optimized: string): string | null {
  try {
    const url = new URL(optimized, "http://local");
    const original = url.pathname.endsWith("/_next/image")
      ? url.searchParams.get("url")
      : null;
    return original && /^https?:\/\//.test(original) ? original : null;
  } catch {
    return null;
  }
}

/** Swaps a failed optimised image for its original. False when there is nothing to fall back to. */
export function showOriginal(img: HTMLImageElement): boolean {
  const original = originalSource(img.currentSrc || img.src);
  if (!original) {
    return false;
  }
  img.removeAttribute("srcset");
  img.removeAttribute("sizes");
  img.src = original;
  return true;
}
