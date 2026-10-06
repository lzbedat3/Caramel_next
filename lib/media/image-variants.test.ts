import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import { IMAGE_WIDTHS } from "./image-variants";
import { originalSource } from "./original-image";

describe("image variants", () => {
  it("are the only widths the optimiser is allowed to produce", () => {
    const allowed = [
      ...(nextConfig.images?.imageSizes ?? []),
      ...(nextConfig.images?.deviceSizes ?? []),
    ];
    expect(allowed.sort((a, b) => a - b)).toEqual(
      Object.values(IMAGE_WIDTHS).sort((a, b) => a - b),
    );
  });

  it("use a single quality", () => {
    expect(nextConfig.images?.qualities).toEqual([75]);
  });
});

describe("originalSource", () => {
  it("reads the stored photo out of an optimised address", () => {
    const stored =
      "https://project.supabase.co/storage/v1/object/public/menu-items/items/a.webp";
    expect(
      originalSource(
        `/_next/image?url=${encodeURIComponent(stored)}&w=448&q=75`,
      ),
    ).toBe(stored);
  });

  it("has nothing to offer for a photo that is already the original", () => {
    expect(
      originalSource(
        "https://project.supabase.co/storage/v1/object/public/menu-items/items/a.webp",
      ),
    ).toBeNull();
    expect(originalSource("/Caramel_Assets/caramel-logo-mark.webp")).toBeNull();
  });
});
