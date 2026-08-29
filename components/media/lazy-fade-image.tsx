"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/cn";

type LazyFadeImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  eager?: boolean;
  unoptimized?: boolean;
  fit?: "cover" | "contain" | "fill";
};

export function LazyFadeImage({
  src,
  alt,
  sizes,
  className,
  priority = false,
  eager = false,
  unoptimized,
  fit = "cover",
}: LazyFadeImageProps) {
  const [loaded, setLoaded] = useState(priority);
  const fitClass =
    fit === "contain"
      ? "object-contain"
      : fit === "fill"
        ? "object-fill"
        : "object-cover";

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority || eager ? "eager" : "lazy"}
      decoding="async"
      unoptimized={unoptimized}
      onLoad={() => setLoaded(true)}
      className={cn(
        "lazy-fade-img",
        fitClass,
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
