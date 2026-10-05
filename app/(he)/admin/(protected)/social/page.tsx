import type { Metadata } from "next";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { SocialManager } from "@/features/admin/social/social-manager";
import { getAdminSocialLinks } from "@/services/admin-social";

export const metadata: Metadata = {
  title: "רשתות חברתיות",
};

export default async function AdminSocialPage() {
  const links = await getAdminSocialLinks();

  return (
    <AdminPage>
      <div className="max-w-3xl">
        <AdminPageHeader
          title="רשתות חברתיות"
          description="ניהול קישורי הרשתות שמופיעים באתר. רק קישורים גלויים מוצגים לציבור, לפי הסדר כאן."
        />
        <SocialManager links={links} />
      </div>
    </AdminPage>
  );
}
