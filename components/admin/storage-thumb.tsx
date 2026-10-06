"use client";

import { cn } from "@/lib/cn";
import { IMAGE_WIDTHS, optimizedSource } from "@/lib/media/image-variants";
import { showOriginal } from "@/lib/media/original-image";

type StorageThumbProps = {
  src: string;
  alt: string;
  className?: string;
};

// A stored photo filling its (relative) frame. It uses the very address the
// public menu uses for a dish ring, so the admin never has the optimiser make
// a size of its own.
export function StorageThumb({ src, alt, className }: StorageThumbProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimizedSource(src, IMAGE_WIDTHS.ring)}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("absolute inset-0 size-full", className)}
      onError={(event) => showOriginal(event.currentTarget)}
    />
  );
}
