import type { Metadata } from "next";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { ProfileForm } from "@/features/admin/profile/profile-form";
import { getAdminRestaurantProfile } from "@/services/admin-profile";

export const metadata: Metadata = {
  title: "פרופיל המסעדה",
};

export default async function AdminProfilePage() {
  const { profile, logoSrc } = await getAdminRestaurantProfile();

  return (
    <AdminPage>
      <div className="max-w-3xl">
        <AdminPageHeader
          title="פרופיל המסעדה"
          description={
            profile
              ? "עריכת זהות המסעדה, פרטי קשר ולוגו. השינויים יופיעו באתר הציבורי אחרי השמירה."
              : "עדיין אין שורת פרופיל. השמירה תיצור את הרשומה היחידה (id = 1)."
          }
        />
        <ProfileForm profile={profile} logoSrc={logoSrc} />
      </div>
    </AdminPage>
  );
}
