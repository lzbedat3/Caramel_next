"use client";

import { useEffect, useState } from "react";

export type GallerySlide = {
  id: number;
  src: string;
  srcSet?: string;
  alt: string | null;
  durationMs: number;
};

// Wide screens only: the photos uploaded as "main media" turn slowly in a frame
// in the empty margin, opposite the logo. Phones never load them.
export function SideGallery({ slides }: { slides: GallerySlide[] }) {
  const [index, setIndex] = useState(0);
  const current = slides[index % Math.max(slides.length, 1)];

  useEffect(() => {
    if (slides.length < 2 || !current) {
      return;
    }
    const wide = window.matchMedia("(min-width: 1100px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!wide.matches || still.matches) {
      return;
    }
    const timer = window.setTimeout(
      () => setIndex((value) => (value + 1) % slides.length),
      current.durationMs,
    );
    return () => window.clearTimeout(timer);
  }, [slides.length, current]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <aside id="gallery" aria-hidden="true">
      {slides.map((slide, slideIndex) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.id}
          src={slide.src}
          srcSet={slide.srcSet}
          sizes="(min-width: 1100px) 24vw, 1px"
          alt=""
          loading="lazy"
          decoding="async"
          data-on={slideIndex === index ? "" : undefined}
        />
      ))}
    </aside>
  );
}
