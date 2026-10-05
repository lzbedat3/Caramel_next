import type { Metadata } from "next";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { getPublicSiteUrl } from "@/config/site";
import { LocationsManager } from "@/features/admin/locations/locations-manager";
import { getAdminLocations } from "@/services/admin-locations";

export const metadata: Metadata = {
  title: "סניפים",
};

export default async function AdminLocationsPage() {
  const locations = await getAdminLocations();

  return (
    <AdminPage>
      <div className="max-w-3xl">
        <AdminPageHeader
          title="סניפים"
          description="לכל סניף כתובת קבועה באתר, קוד QR משלו, פרטי קשר ושעות פתיחה. התפריט עצמו משותף לכל הסניפים."
        />
        <LocationsManager locations={locations} siteUrl={getPublicSiteUrl()} />
      </div>
    </AdminPage>
  );
}
