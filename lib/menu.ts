import type { PublicCategory, PublicMenuItem } from "@/lib/public-content";

export const MENU_ELEMENT_ID = "menu";

export type PublicMenuSection = {
  category: PublicCategory;
  items: PublicMenuItem[];
};

export function buildMenuSections(
  categories: PublicCategory[],
  items: PublicMenuItem[],
): PublicMenuSection[] {
  const itemsByCategory = new Map<number, PublicMenuItem[]>();

  for (const item of items) {
    const existing = itemsByCategory.get(item.categoryId);
    if (existing) {
      existing.push(item);
    } else {
      itemsByCategory.set(item.categoryId, [item]);
    }
  }

  return categories.map((category) => ({
    category,
    items: itemsByCategory.get(category.id) ?? [],
  }));
}

export function visibleMenuSections(
  sections: PublicMenuSection[],
): PublicMenuSection[] {
  const filled = sections.filter((section) => section.items.length > 0);
  if (filled.length > 0) {
    return filled;
  }

  return sections.length === 1 ? sections : [];
}
