import type { Metadata } from "next";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { HeroManager } from "@/features/admin/hero/hero-manager";
import { getAdminHeroMedia } from "@/services/admin-hero";

export const metadata: Metadata = {
  title: "מדיה ראשית",
};

export default async function AdminHeroPage() {
  const items = await getAdminHeroMedia();

  return (
    <AdminPage>
      <div className="max-w-3xl">
        <AdminPageHeader
          title="מדיה ראשית"
          description="ניהול תמונות וסרטוני ההירו, כולל סדר תצוגה, נראות והגדרות ניגון. רק פריטים גלויים מופיעים באתר."
        />
        <HeroManager items={items} />
      </div>
    </AdminPage>
  );
}
