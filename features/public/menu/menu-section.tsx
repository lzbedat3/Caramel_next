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

  return (
    <>
      <header className="mb-2.5 ps-4 pe-5 text-start sm:mb-3 sm:pe-8 lg:pe-12">
        <PublicHeading
          as="h2"
          id={`menu-category-${category.id}`}
          invert
          className="text-xl sm:text-2xl lg:text-3xl"
        >
          {category.name}
        </PublicHeading>
        {category.subtitle ? (
          <p className="menu-category-title mt-1 text-sm leading-5 sm:text-base">
            {category.subtitle}
          </p>
        ) : null}
      </header>
      <div
        className="mx-4 mb-3 h-px bg-caramel/20 sm:mx-5 sm:mb-4"
        aria-hidden="true"
      />

      {items.length > 0 ? (
        <div className="overflow-x-auto overscroll-x-contain scroll-smooth ps-4 pe-5 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] sm:pe-8 lg:pe-12 [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max snap-x snap-mandatory gap-2.5 sm:gap-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="w-[calc((100vw-4.25rem)/2.25)] shrink-0 snap-start sm:w-[calc((100vw-5.5rem)/2.25)] md:w-[calc((100vw-5.5rem)/3.5)] lg:w-[calc((100vw-6.5rem)/4)] xl:w-[calc((100vw-6.5rem)/6)]"
              >
                <MenuItemCard
                  item={item}
                  onSelect={() => onSelectItem(item)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="ps-4 pe-5 text-sm leading-6 text-muted sm:pe-8 lg:pe-12">
          אין פריטים בקטגוריה זו כרגע
        </p>
      )}
    </>
  );
}
