import { isSafeInternalPath } from "@/lib/safe-redirect";

export const routes = {
  home: "/",
  portal: "/portal",
  admin: "/admin",
  adminProfile: "/admin/profile",
  adminHero: "/admin/hero",
  adminCategories: "/admin/categories",
  adminMenu: "/admin/menu",
  adminHours: "/admin/hours",
  adminSocial: "/admin/social",
  adminMedia: "/admin/media",
  adminSettings: "/admin/settings",
  authCallback: "/auth/callback",
  authConfirm: "/auth/confirm",
  authError: "/auth/error",
} as const;

export function isAdminPath(pathname: string): boolean {
  return pathname === routes.admin || pathname.startsWith(`${routes.admin}/`);
}

export function isPortalPath(pathname: string): boolean {
  return pathname === routes.portal || pathname.startsWith(`${routes.portal}/`);
}

export function getSafeAdminPath(path: string | null | undefined): string {
  if (path && isSafeInternalPath(path) && isAdminPath(path)) {
    return path;
  }

  return routes.admin;
}

export function isAuthPath(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}
