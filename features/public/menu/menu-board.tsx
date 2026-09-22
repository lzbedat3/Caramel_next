"use client";

import { useCallback, useState } from "react";

import { MenuItemModal } from "@/features/public/menu/menu-item-modal";
import { MenuSection } from "@/features/public/menu/menu-section";
import { cn } from "@/lib/cn";
import { categorySectionId } from "@/lib/category-nav";
import { MENU_ELEMENT_ID, type PublicMenuSection } from "@/lib/menu";
import type { PublicMenuItem } from "@/lib/public-content";

type MenuBoardProps = {
  sections: PublicMenuSection[];
};

export function MenuBoard({ sections }: MenuBoardProps) {
  const [activeItem, setActiveItem] = useState<PublicMenuItem | null>(null);
  const closeItem = useCallback(() => setActiveItem(null), []);

  const activeItems =
    sections.find((section) =>
      section.items.some((item) => item.id === activeItem?.id),
    )?.items ?? [];
  const activeIndex = activeItems.findIndex(
    (item) => item.id === activeItem?.id,
  );

  return (
    <div
      id={MENU_ELEMENT_ID}
      className="mx-auto max-w-7xl scroll-mt-36 px-3 pt-3 pb-10 sm:px-8 sm:pt-5"
    >
      <div className="flex flex-col gap-3 sm:gap-5">
        {sections.map((section, index) => (
          <section
            key={section.category.id}
            id={categorySectionId(section.category.id)}
            aria-labelledby={`menu-category-${section.category.id}`}
            className="scroll-mt-36"
          >
            <div
              className={cn(
                "menu-category-board",
                index % 2 === 1 && "menu-category-board-alt",
              )}
            >
              <div className="menu-category-board-face">
                <MenuSection section={section} onSelectItem={setActiveItem} />
              </div>
            </div>
          </section>
        ))}
      </div>
      {activeItem ? (
        <MenuItemModal
          item={activeItem}
          onClose={closeItem}
          position={activeIndex + 1}
          total={activeItems.length}
          onPrevious={
            activeIndex > 0
              ? () => setActiveItem(activeItems[activeIndex - 1] ?? null)
              : undefined
          }
          onNext={
            activeIndex < activeItems.length - 1
              ? () => setActiveItem(activeItems[activeIndex + 1] ?? null)
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
