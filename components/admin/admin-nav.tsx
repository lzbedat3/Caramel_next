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
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-surface text-caramel-deep shadow-soft"
                    : "text-muted hover:bg-surface/70 hover:text-foreground",
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
