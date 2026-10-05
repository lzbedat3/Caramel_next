import Link from "next/link";

import { AdminPage } from "@/components/admin/admin-page";
import { adminNavItems } from "@/config/admin-nav";
import { brandAssets } from "@/config/brand-assets";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";
import type { AdminDashboardSnapshot } from "@/services/admin-dashboard";

type DashboardViewProps = {
  snapshot: AdminDashboardSnapshot;
};

function StatusChip({ on, children }: { on: boolean; children: string }) {
  return (
    <span
      className={cn(
        "rounded-pill inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium",
        on ? "bg-open-soft text-open" : "bg-closed-soft text-closed",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

type StatProps = {
  label: string;
  value: string;
  hint?: string;
  href: string;
};

function Stat({ label, value, hint, href }: StatProps) {
  return (
    <Link
      href={href}
      className="group rounded-card border-border bg-surface hover:border-caramel-soft hover:bg-surface-warm/60 focus-visible:ring-ring border px-5 py-4 transition focus-visible:ring-2 focus-visible:outline-none"
    >
      <p className="text-muted text-sm">{label}</p>
      <p className="text-foreground mt-1.5 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="text-muted-soft mt-1 text-xs leading-5">{hint}</p>
      ) : null}
    </Link>
  );
}

type Task = { count: number; label: string; href: string; action: string };

export function DashboardView({ snapshot }: DashboardViewProps) {
  const tasks: Task[] = [
    {
      count: snapshot.profileExists && snapshot.isActive ? 0 : 1,
      label: snapshot.profileExists
        ? "האתר הציבורי כבוי, האורחים רואים תפריט ריק"
        : "עדיין לא הוגדר פרופיל למסעדה",
      href: routes.adminProfile,
      action: "לפרופיל",
    },
    {
      count: snapshot.openingHoursRowCount === 0 ? 1 : 0,
      label: "לא הוגדרו שעות פתיחה",
      href: routes.adminHours,
      action: "לשעות הפתיחה",
    },
    {
      count: snapshot.itemsWithoutImage,
      label: "מנות גלויות בלי תמונה",
      href: routes.adminMenu,
      action: "למנות",
    },
    {
      count: snapshot.itemsMissingTranslation,
      label: "מנות גלויות בלי תרגום לערבית או לאנגלית",
      href: routes.adminMenu,
      action: "למנות",
    },
    {
      count: snapshot.unavailableItemCount,
      label: "מנות מסומנות כלא זמינות",
      href: routes.adminMenu,
      action: "למנות",
    },
    {
      count: snapshot.hiddenItemCount,
      label: "מנות מוסתרות מהתפריט",
      href: routes.adminMenu,
      action: "למנות",
    },
    {
      count: snapshot.hiddenCategoryCount,
      label: "קטגוריות מוסתרות",
      href: routes.adminCategories,
      action: "לקטגוריות",
    },
  ].filter((task) => task.count > 0);

  const sections = adminNavItems.filter((item) => item.href !== routes.admin);

  return (
    <AdminPage>
      <section className="rounded-card border-border bg-surface relative overflow-hidden border px-5 py-6 sm:px-7 sm:py-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_0%_0%,rgb(233_164_58/0.16),transparent_60%)]"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandAssets.logoMark}
            alt=""
            width={88}
            height={88}
            className="size-[88px] shrink-0 drop-shadow-[0_8px_18px_rgb(0_0_0/0.5)]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-caramel-deep text-sm">לוח בקרה</p>
            <h1 className="text-foreground mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {snapshot.restaurantName ?? "המסעדה שלך"}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusChip on={Boolean(snapshot.isActive)}>
                {snapshot.isActive ? "האתר באוויר" : "האתר כבוי"}
              </StatusChip>
              {snapshot.isOpenNow === null ? null : (
                <StatusChip on={snapshot.isOpenNow}>
                  {snapshot.isOpenNow ? "פתוח עכשיו" : "סגור עכשיו"}
                </StatusChip>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={routes.adminMenu}
              className="rounded-pill text-espresso focus-visible:ring-ring inline-flex items-center justify-center bg-[image:var(--gloss-caramel)] px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-gloss)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:outline-none"
            >
              ניהול המנות
            </Link>
            <a
              href={routes.home}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-pill border-border text-foreground hover:bg-surface-warm focus-visible:ring-ring inline-flex items-center justify-center border px-5 py-2.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none"
            >
              צפייה בתפריט
            </a>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="מנות בתפריט"
          value={String(snapshot.visibleItemCount)}
          hint={
            snapshot.hiddenItemCount > 0
              ? `ועוד ${snapshot.hiddenItemCount} מוסתרות`
              : "כולן גלויות"
          }
          href={routes.adminMenu}
        />
        <Stat
          label="קטגוריות"
          value={String(snapshot.categoryCount)}
          hint={
            snapshot.hiddenCategoryCount > 0
              ? `${snapshot.hiddenCategoryCount} מוסתרות`
              : undefined
          }
          href={routes.adminCategories}
        />
        <Stat
          label="לא זמינות כרגע"
          value={String(snapshot.unavailableItemCount)}
          hint="מופיעות בתפריט עם סימון"
          href={routes.adminMenu}
        />
        <Stat
          label="שעות פתיחה"
          value={snapshot.openingHoursRowCount > 0 ? "מוגדרות" : "חסרות"}
          hint={
            snapshot.openingHoursRowCount > 0
              ? `${snapshot.openingHoursRowCount} רשומות`
              : undefined
          }
          href={routes.adminHours}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <section className="rounded-card border-border bg-surface border px-5 py-5 lg:col-span-3">
          <h2 className="text-foreground text-base font-medium">
            דורש תשומת לב
          </h2>
          {tasks.length === 0 ? (
            <p className="text-muted mt-3 text-sm leading-6">
              הכול מסודר: התפריט מלא, מתורגם ועם תמונות.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {tasks.map((task) => (
                <li
                  key={task.label}
                  className="border-border border-t first:border-t-0"
                >
                  <Link
                    href={task.href}
                    className="rounded-control hover:bg-surface-warm/60 focus-visible:ring-ring flex items-center gap-3 px-1 py-3 text-sm transition focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="rounded-pill bg-caramel-soft/40 text-caramel-deep flex h-7 min-w-7 items-center justify-center px-2 text-xs font-semibold tabular-nums">
                      {task.count}
                    </span>
                    <span className="text-foreground min-w-0 flex-1">
                      {task.label}
                    </span>
                    <span className="text-caramel-deep shrink-0 text-xs">
                      {task.action}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card border-border bg-surface border px-5 py-5 lg:col-span-2">
          <h2 className="text-foreground text-base font-medium">קיצורי דרך</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {sections.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-control border-border text-foreground hover:border-caramel-soft hover:bg-surface-warm/60 focus-visible:ring-ring flex items-center gap-2.5 border px-3 py-3 text-sm transition focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Icon className="text-caramel-deep size-4.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AdminPage>
  );
}
