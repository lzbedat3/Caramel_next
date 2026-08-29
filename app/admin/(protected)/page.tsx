import type { Metadata } from "next";

import { DashboardView } from "@/features/admin/dashboard/dashboard-view";
import { getAdminDashboardSnapshot } from "@/services/admin-dashboard";

export const metadata: Metadata = {
  title: "לוח בקרה",
};

export default async function AdminHomePage() {
  const snapshot = await getAdminDashboardSnapshot();
  return <DashboardView snapshot={snapshot} />;
}
