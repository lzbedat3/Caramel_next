import type { Metadata } from "next";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { HoursManager } from "@/features/admin/hours/hours-manager";
import { getAdminHours } from "@/services/admin-hours";

export const metadata: Metadata = {
  title: "שעות פתיחה",
};

export default async function AdminHoursPage() {
  const hours = await getAdminHours();

  return (
    <AdminPage>
      <div className="max-w-3xl">
        <AdminPageHeader
          title="שעות פתיחה"
          description="ניהול שעות לפי ימי השבוע. אפשר כמה משמרות באותו יום, סימון יום כסגור, והערה אופציונלית."
        />
        <HoursManager hours={hours} />
      </div>
    </AdminPage>
  );
}
