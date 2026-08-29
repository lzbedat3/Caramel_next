"use client";

import { LayoutGroup } from "motion/react";

import { CategoryItem } from "@/features/public/categories/category-item";
import type { CategorySelection } from "@/lib/category-nav";
import type { PublicCategory } from "@/lib/public-content";

type CategoryRailProps = {
  categories: PublicCategory[];
  selectedCategory: CategorySelection;
  onSelect: (id: NonNullable<CategorySelection>) => void;
};

export function CategoryRail({
  categories,
  selectedCategory,
  onSelect,
}: CategoryRailProps) {
  const validIds = new Set(categories.map((category) => String(category.id)));
  const active =
    selectedCategory && validIds.has(selectedCategory)
      ? selectedCategory
      : null;

  return (
    <div
      data-category-rail
      className="-mx-5 overflow-x-auto overscroll-x-contain px-5 pt-1.5 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] sm:-mx-8 sm:px-8 md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <LayoutGroup>
        <ul className="mx-auto flex w-max snap-x snap-mandatory items-start justify-center gap-4 sm:gap-5 md:w-full md:flex-wrap lg:gap-6 xl:gap-8">
          {categories.map((category) => {
            const id = String(category.id) as `${number}`;
            return (
              <CategoryItem
                key={category.id}
                id={id}
                name={category.name}
                subtitle={category.subtitle}
                imageSrc={category.imageSrc}
                selected={active === id}
                onSelect={onSelect}
              />
            );
          })}
        </ul>
      </LayoutGroup>
    </div>
  );
}
