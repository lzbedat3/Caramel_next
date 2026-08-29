import { MenuBoard } from "@/features/public/menu/menu-board";
import { visibleMenuSections, type PublicMenuSection } from "@/lib/menu";

type MenuProps = {
  sections: PublicMenuSection[];
  hasCategories: boolean;
};

export function Menu({ sections, hasCategories }: MenuProps) {
  if (!hasCategories) {
    return null;
  }

  const visible = visibleMenuSections(sections);

  if (visible.length === 0) {
    return (
      <p className="mx-auto w-full max-w-6xl px-5 pb-20 text-sm leading-6 text-muted sm:px-8 sm:pb-24 lg:px-12">
        אין פריטים בתפריט כרגע
      </p>
    );
  }

  return <MenuBoard sections={visible} />;
}
