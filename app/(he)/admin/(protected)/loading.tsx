import { AdminPage } from "@/components/admin/admin-page";

export default function AdminLoading() {
  return (
    <AdminPage>
      <div className="mb-8 space-y-3">
        <div className="h-8 w-40 rounded-control bg-surface-warm" />
        <div className="h-4 w-72 max-w-full rounded-pill bg-surface-warm/80" />
      </div>
      <div className="h-64 animate-pulse rounded-card bg-surface-warm/70" />
    </AdminPage>
  );
}
