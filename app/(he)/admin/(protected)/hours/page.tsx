import type { Metadata } from "next";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { HoursManager } from "@/features/admin/hours/hours-manager";
import { getAdminHours } from "@/services/admin-hours";
import { getAdminLocations } from "@/services/admin-locations";

export const metadata: Metadata = {
  title: "שעות פתיחה",
};

export default async function AdminHoursPage() {
  const [hours, locations] = await Promise.all([
    getAdminHours(),
    getAdminLocations(),
  ]);

  return (
    <AdminPage>
      <div className="max-w-3xl">
        <AdminPageHeader
          title="שעות פתיחה"
          description="ניהול שעות לפי ימי השבוע, לכל סניף בנפרד. אפשר כמה משמרות באותו יום, סימון יום כסגור, והערה אופציונלית."
        />
        <HoursManager
          hours={hours}
          locations={locations.map(({ id, name }) => ({ id, name }))}
        />
      </div>
    </AdminPage>
  );
}
