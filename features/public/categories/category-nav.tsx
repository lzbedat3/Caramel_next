import { PublicSection } from "@/components/public/section";
import { CategoryRail } from "@/features/public/categories/category-rail";
import type { CategorySelection } from "@/lib/category-nav";
import type { PublicCategory } from "@/lib/public-content";

type CategoryNavProps = {
  categories: PublicCategory[];
  selectedCategory: CategorySelection;
  onSelect: (id: NonNullable<CategorySelection>) => void;
};

export function CategoryNav({
  categories,
  selectedCategory,
  onSelect,
}: CategoryNavProps) {
  const hasCategories = categories.length > 0;

  return (
    <div
      data-category-nav
      className="sticky top-0 z-40 border-b border-caramel/20 bg-background/85 shadow-[0_16px_32px_-24px_rgb(43_17_6_/_0.55)] backdrop-blur-md transition-shadow duration-300"
    >
      <PublicSection
        aria-label="קטגוריות"
        className="pt-3 pb-2 sm:pt-3.5 sm:pb-3"
        containerClassName="pt-0"
      >
        {hasCategories ? (
          <CategoryRail
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={onSelect}
          />
        ) : (
          <p className="text-sm leading-6 text-muted">
            הקטגוריות יופיעו כאן כשיתעדכנו במערכת
          </p>
        )}
      </PublicSection>
    </div>
  );
}
