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

  return (
    <div
      id={MENU_ELEMENT_ID}
      className="scroll-mt-36 px-4 pb-16 pt-5 sm:scroll-mt-40 sm:px-5 sm:pb-20 sm:pt-6"
    >
      <div className="flex flex-col gap-5 sm:gap-6 lg:gap-7">
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
              <div className="menu-category-board-face py-5 sm:py-8 lg:py-9">
                <MenuSection
                  section={section}
                  onSelectItem={setActiveItem}
                />
              </div>
            </div>
          </section>
        ))}
      </div>
      {activeItem ? (
        <MenuItemModal
          key={activeItem.id}
          item={activeItem}
          onClose={closeItem}
        />
      ) : null}
    </div>
  );
}
