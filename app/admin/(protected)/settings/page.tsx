import type { Metadata } from "next";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { SettingsForm } from "@/features/admin/settings/settings-form";
import { derivedSeoDescription, derivedSeoTitle } from "@/lib/seo";
import { getAdminRestaurantProfile } from "@/services/admin-profile";
import { getAdminSiteSettings } from "@/services/admin-settings";

export const metadata: Metadata = {
  title: "הגדרות",
};

export default async function AdminSettingsPage() {
  const [settings, { profile }] = await Promise.all([
    getAdminSiteSettings(),
    getAdminRestaurantProfile(),
  ]);

  return (
    <AdminPage>
      <div className="max-w-3xl">
        <AdminPageHeader
          title="הגדרות"
          description="הגדרות טכניות לאתר הציבורי: כתובת קנונית, אינדוקס, וכותרת ותיאור SEO אופציונליים."
        />
        <SettingsForm
          settings={settings}
          derivedTitle={derivedSeoTitle(profile)}
          derivedDescription={derivedSeoDescription(profile)}
          restaurantActive={Boolean(profile?.is_active)}
        />
      </div>
    </AdminPage>
  );
}
