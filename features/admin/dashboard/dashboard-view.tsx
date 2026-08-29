import Link from "next/link";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";
import type { AdminDashboardSnapshot } from "@/services/admin-dashboard";

type DashboardViewProps = {
  snapshot: AdminDashboardSnapshot;
};

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  href?: string;
};

function StatCard({ label, value, hint, href }: StatCardProps) {
  const content = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs leading-5 text-muted-soft">{hint}</p> : null}
    </>
  );

  const className =
    "rounded-card border border-border bg-surface px-5 py-4 transition";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          className,
          "block hover:border-caramel-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function DashboardView({ snapshot }: DashboardViewProps) {
  return (
    <AdminPage>
      <AdminPageHeader
        title="לוח בקרה"
        description="מצב תוכן חי מתוך Supabase. אין כאן נתונים מדומים או ניתוחים מומצאים."
      />
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="פרופיל המסעדה"
          value={
            !snapshot.profileExists
              ? "חסר"
              : snapshot.isActive
                ? "פעיל"
                : "כבוי"
          }
          hint={
            snapshot.restaurantName
              ? snapshot.restaurantName
              : snapshot.profileExists
                ? "הפרופיל קיים אך האתר הציבורי מוסתר"
                : "טרם הוגדר פרופיל"
          }
          href={routes.adminProfile}
        />
        <StatCard
          label="קטגוריות"
          value={String(snapshot.categoryCount)}
          href={routes.adminCategories}
        />
        <StatCard
          label="מנות"
          value={String(snapshot.menuItemCount)}
          href={routes.adminMenu}
        />
        <StatCard
          label="מנות לא זמינות"
          value={String(snapshot.unavailableItemCount)}
          hint="פריטים שמסומנים כלא זמינים"
          href={routes.adminMenu}
        />
        <StatCard
          label="מדיה ראשית גלויה"
          value={String(snapshot.visibleHeroCount)}
          href={routes.adminHero}
        />
        <StatCard
          label="שעות פתיחה"
          value={
            snapshot.openingHoursRowCount > 0 ? "מוגדרות" : "טרם הוגדרו"
          }
          hint={
            snapshot.openingHoursRowCount > 0
              ? `${snapshot.openingHoursRowCount} רשומות`
              : undefined
          }
          href={routes.adminHours}
        />
      </div>
    </AdminPage>
  );
}
