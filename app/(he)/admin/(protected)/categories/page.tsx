import type { Metadata } from "next";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { CategoryManager } from "@/features/admin/categories/category-manager";
import { getAdminCategories } from "@/services/admin-categories";

export const metadata: Metadata = {
  title: "קטגוריות",
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <AdminPage>
      <div className="max-w-3xl">
        <AdminPageHeader
          title="קטגוריות"
          description="ניהול קטגוריות התפריט, התמונות, הנראות והסדר שלהן. רק קטגוריות גלויות מופיעות באתר הציבורי."
        />
        <CategoryManager categories={categories} />
      </div>
    </AdminPage>
  );
}
