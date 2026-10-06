import { getImageProps } from "next/image";

import { isRemoteSvg } from "@/lib/storage-url";

// Every optimised size the site asks for. Each stored photo is transformed at
// most once per width, so the list is kept to what the layout really shows.
// next.config.ts allows exactly these widths and nothing else.
export const IMAGE_WIDTHS = {
  /** Category pictures in the floating bar (52px). */
  small: 128,
  /** A dish ring, and everything that reuses it: the dialog's first frame, the table, the admin. */
  ring: 448,
  /** The dish dialog (up to 378px wide, twice over for dense screens). */
  detail: 768,
} as const;

export type ImageWidth = (typeof IMAGE_WIDTHS)[keyof typeof IMAGE_WIDTHS];

// One address per photo and size, shared by every screen density and every
// place the photo appears. Given a width and no `sizes`, next/image offers that
// width for 1x screens and a larger one for 2x; only the first is used here.
export function optimizedSource(src: string, width: ImageWidth): string {
  const { props } = getImageProps({
    src,
    alt: "",
    width,
    height: width,
    unoptimized: isRemoteSvg(src),
  });
  return props.srcSet?.split(" ", 1)[0] ?? props.src;
}
