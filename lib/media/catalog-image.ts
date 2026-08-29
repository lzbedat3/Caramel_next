import type { ImageLoaderProps } from "next/image";
import { getImageProps } from "next/image";

import {
  MENU_IMAGE_MAX_REQUEST_WIDTH,
  MENU_MODAL_IMAGE_SIZES,
} from "@/lib/media/web-image";

export function catalogImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  const w = Math.min(width, MENU_IMAGE_MAX_REQUEST_WIDTH);
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${quality ?? 70}`;
}

export function prefetchMenuModalImage(src: string) {
  if (typeof document === "undefined") {
    return;
  }

  const { props } = getImageProps({
    src,
    alt: "",
    width: MENU_IMAGE_MAX_REQUEST_WIDTH,
    height: MENU_IMAGE_MAX_REQUEST_WIDTH,
    quality: 70,
    sizes: MENU_MODAL_IMAGE_SIZES,
    loader: catalogImageLoader,
  });

  const href = props.src;
  if (!href || document.querySelector(`link[data-menu-preload="${href}"]`)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = href;
  link.setAttribute("data-menu-preload", href);
  document.head.appendChild(link);
}
