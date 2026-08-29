import type { ComponentType } from "react";

import {
  BrandingIcon,
  CategoriesIcon,
  ClockIcon,
  DashboardIcon,
  ImageIcon,
  MenuListIcon,
  SettingsIcon,
  ShareIcon,
  StorefrontIcon,
} from "@/components/icons";
import { routes } from "@/config/routes";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: routes.admin,
    label: "לוח בקרה",
    icon: DashboardIcon,
    exact: true,
  },
  {
    href: routes.adminProfile,
    label: "פרופיל המסעדה",
    icon: StorefrontIcon,
  },
  {
    href: routes.adminHero,
    label: "מדיה ראשית",
    icon: ImageIcon,
  },
  {
    href: routes.adminCategories,
    label: "קטגוריות",
    icon: CategoriesIcon,
  },
  {
    href: routes.adminMenu,
    label: "מנות",
    icon: MenuListIcon,
  },
  {
    href: routes.adminHours,
    label: "שעות פתיחה",
    icon: ClockIcon,
  },
  {
    href: routes.adminSocial,
    label: "רשתות חברתיות",
    icon: ShareIcon,
  },
  {
    href: routes.adminMedia,
    label: "מיתוג ומדיה",
    icon: BrandingIcon,
  },
  {
    href: routes.adminSettings,
    label: "הגדרות",
    icon: SettingsIcon,
  },
];

export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
