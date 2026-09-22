"use client";

import { LazyFadeImage } from "@/components/media/lazy-fade-image";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/cn";
import type { CategorySelection } from "@/lib/category-nav";
import { isRemoteSvg } from "@/lib/storage-url";

type CategoryItemProps = {
  id: NonNullable<CategorySelection>;
  name: string;
  subtitle?: string | null;
  imageSrc?: string | null;
  selected: boolean;
  onSelect: (id: NonNullable<CategorySelection>) => void;
};

export function CategoryItem({
  id,
  name,
  subtitle,
  imageSrc,
  selected,
  onSelect,
}: CategoryItemProps) {
  const reduceMotion = useReducedMotion();
  const initial = name.trim().charAt(0);
  const showSubtitle = Boolean(subtitle);

  return (
    <li className="snap-start">
      <button
        type="button"
        data-category={id}
        aria-pressed={selected}
        onClick={() => onSelect(id)}
        className="focus-visible:ring-ring focus-visible:ring-offset-background flex w-[4.75rem] shrink-0 flex-col items-center gap-1.5 rounded-full transition duration-300 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:hover:scale-[1.04] motion-safe:active:scale-95 sm:w-[5.5rem] sm:gap-2.5 lg:w-24"
      >
        <span className="relative flex size-[4.75rem] items-center justify-center sm:size-[5.5rem] lg:size-24">
          {selected ? (
            <motion.span
              layoutId={reduceMotion ? undefined : "category-active-fill"}
              className="from-caramel-soft via-caramel to-caramel-deep shadow-soft absolute inset-0 rounded-full bg-gradient-to-br"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <span className="from-surface-warm to-caramel-soft/60 absolute inset-0 rounded-full bg-gradient-to-br" />
          )}
          <span
            className={cn(
              "bg-surface relative flex size-[4.15rem] items-center justify-center overflow-hidden rounded-full sm:size-[4.85rem] lg:size-[5.35rem]",
              selected && "bg-surface",
            )}
          >
            {imageSrc ? (
              <LazyFadeImage
                src={imageSrc}
                alt=""
                sizes="40px"
                unoptimized={isRemoteSvg(imageSrc)}
              />
            ) : initial ? (
              <span className="font-display text-caramel-deep text-xl sm:text-2xl">
                {initial}
              </span>
            ) : (
              <span className="bg-caramel-soft/70 size-8 rounded-full" />
            )}
          </span>
        </span>
        <span className="flex flex-col items-center text-center">
          <span
            className={cn(
              "text-sm leading-5 font-medium transition-colors duration-300",
              selected ? "text-foreground" : "text-muted",
            )}
          >
            {name}
          </span>
          {showSubtitle ? (
            <span
              className={cn(
                "mt-0.5 line-clamp-1 text-xs leading-4",
                selected ? "text-muted-soft" : "invisible",
              )}
            >
              {subtitle}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}
