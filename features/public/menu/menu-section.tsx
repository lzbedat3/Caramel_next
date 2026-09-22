"use client";

import { useRef } from "react";
import { PublicHeading } from "@/components/public/heading";
import { MenuItemCard } from "@/features/public/menu/menu-item-card";
import type { PublicMenuSection } from "@/lib/menu";
import type { PublicMenuItem } from "@/lib/public-content";

type MenuSectionProps = {
  section: PublicMenuSection;
  onSelectItem: (item: PublicMenuItem) => void;
};

export function MenuSection({ section, onSelectItem }: MenuSectionProps) {
  const { category, items } = section;
  const rail = useRef<HTMLUListElement>(null);
  function move(direction: number) {
    const node = rail.current;
    if (!node) return;
    node.scrollBy({
      left: direction * node.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <>
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <PublicHeading
              as="h2"
              id={`menu-category-${category.id}`}
              className="text-xl sm:text-2xl"
            >
              {category.name}
            </PublicHeading>
            <span className="text-muted border-border rounded-full border px-2 py-0.5 text-[10px] tabular-nums">
              {items.length}
            </span>
          </div>
          {category.subtitle ? (
            <p className="text-muted mt-1 text-xs">{category.subtitle}</p>
          ) : null}
        </div>
        {items.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="text-muted me-1 hidden text-[11px] sm:block">
              גללו וגלו
            </span>
            <button
              type="button"
              className="rail-arrow"
              onClick={() => move(1)}
              aria-label={`הקודם ב${category.name}`}
            >
              →
            </button>
            <button
              type="button"
              className="rail-arrow"
              onClick={() => move(-1)}
              aria-label={`הבא ב${category.name}`}
            >
              ←
            </button>
          </div>
        ) : null}
      </header>
      {items.length > 0 ? (
        <ul
          ref={rail}
          aria-label={category.name}
          tabIndex={0}
          className="dish-rail flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain px-4 pt-1 pb-4 sm:gap-3 sm:px-5"
        >
          {items.map((item) => (
            <li
              key={item.id}
              className="w-[min(42vw,10rem)] shrink-0 snap-start sm:w-44 lg:w-48"
            >
              <MenuItemCard item={item} onSelect={() => onSelectItem(item)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted px-4 pb-4 text-sm">
          אין פריטים בקטגוריה זו כרגע
        </p>
      )}
    </>
  );
}
