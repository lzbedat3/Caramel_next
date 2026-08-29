"use client";

import { LazyFadeImage } from "@/components/media/lazy-fade-image";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { HeroSlide } from "@/services/public-home";

type HeroMediaStageProps = {
  slides: HeroSlide[];
};

function slideAlt(slide: HeroSlide): string {
  return slide.alt?.trim() || "מדיה ראשית";
}

function HeroVideo({
  slide,
  reduceMotion,
  paused,
  active,
  priority,
  preload,
  onEnded,
}: {
  slide: HeroSlide;
  reduceMotion: boolean;
  paused: boolean;
  active: boolean;
  priority: boolean;
  preload: "metadata" | "none";
  onEnded?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldPlay = slide.autoplay && !reduceMotion && !paused && active;
  const muted = slide.muted || slide.autoplay;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (shouldPlay) {
      void video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }, [paused, shouldPlay, slide.id]);

  if (reduceMotion && slide.posterSrc) {
    return (
      <Image
        src={slide.posterSrc}
        alt={slideAlt(slide)}
        fill
        sizes="100vw"
        priority={priority}
        className="object-cover"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 size-full object-cover"
      src={slide.src}
      poster={slide.posterSrc ?? undefined}
      muted={muted}
      loop={slide.loop}
      playsInline
      preload={preload}
      aria-label={slideAlt(slide)}
      onEnded={slide.loop ? undefined : onEnded}
    />
  );
}

function HeroSlideMedia({
  slide,
  reduceMotion,
  paused,
  active,
  priority,
  preload,
  onEnded,
}: {
  slide: HeroSlide;
  reduceMotion: boolean;
  paused: boolean;
  active: boolean;
  priority: boolean;
  preload: "metadata" | "none";
  onEnded?: () => void;
}) {
  if (slide.type === "video") {
    return (
      <HeroVideo
        slide={slide}
        reduceMotion={reduceMotion}
        paused={paused}
        active={active}
        priority={priority}
        preload={preload}
        onEnded={onEnded}
      />
    );
  }

  return (
    <LazyFadeImage
      src={slide.src}
      alt={slideAlt(slide)}
      sizes="100vw"
      priority={priority}
    />
  );
}

export function HeroMediaStage({ slides }: HeroMediaStageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const current = slides[index];
  const firstId = slides[0]?.id;
  const canAdvance = slides.length > 1 && !reduceMotion;

  useEffect(() => {
    if (!canAdvance || paused) {
      return;
    }

    const slide = slides[index];
    if (!slide) {
      return;
    }

    if (slide.type === "video" && !slide.loop) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, slide.durationMs);

    return () => window.clearTimeout(timer);
  }, [canAdvance, index, paused, slides]);

  if (!current) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={current.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 1.15,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <HeroSlideMedia
            slide={current}
            reduceMotion={reduceMotion}
            paused={paused}
            active
            priority={current.id === firstId}
            preload={current.id === firstId ? "metadata" : "none"}
            onEnded={() => {
              if (canAdvance && !paused) {
                setIndex((currentIndex) => (currentIndex + 1) % slides.length);
              }
            }}
          />
        </motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/55" />
      {canAdvance ? (
        <button
          type="button"
          className="absolute end-4 bottom-4 z-10 rounded-pill bg-surface/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm transition duration-300 hover:bg-surface hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          aria-pressed={paused}
          aria-label={paused ? "המשך מצגת המדיה" : "השהיית מצגת המדיה"}
          onClick={() => setPaused((currentPaused) => !currentPaused)}
        >
          {paused ? "המשך" : "השהיה"}
        </button>
      ) : null}
    </div>
  );
}
