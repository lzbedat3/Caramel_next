import type { Metadata } from "next";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { MenuManager } from "@/features/admin/menu/menu-manager";
import { getAdminMenu } from "@/services/admin-menu";

export const metadata: Metadata = {
  title: "מנות",
};

export default async function AdminMenuPage() {
  const { categories, items } = await getAdminMenu();

  return (
    <AdminPage>
      <div className="max-w-3xl">
        <AdminPageHeader
          title="מנות"
          description="ניהול פריטי התפריט לפי קטגוריה: מחיר, תמונה, נראות וזמינות. רק מנות גלויות מופיעות באתר."
        />
        <MenuManager categories={categories} items={items} />
      </div>
    </AdminPage>
  );
}
