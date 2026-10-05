"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavItems, isAdminNavActive } from "@/config/admin-nav";
import { cn } from "@/lib/cn";

type AdminNavProps = {
  onNavigate?: () => void;
};

export function AdminNav({ onNavigate }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="ניווט ניהול">
      <ul className="flex flex-col gap-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isAdminNavActive(pathname, item);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                // Loads each section with its data ahead of the click, so
                // moving between sections does not wait on the database.
                prefetch
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-surface-warm text-caramel-deep shadow-[inset_2px_0_0_var(--caramel)] rtl:shadow-[inset_-2px_0_0_var(--caramel)]"
                    : "text-muted hover:bg-surface-warm/60 hover:text-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
