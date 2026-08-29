export const routes = {
  home: "/",
  admin: "/admin",
  adminLogin: "/admin/login",
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

export function isAdminLoginPath(pathname: string): boolean {
  return (
    pathname === routes.adminLogin ||
    pathname.startsWith(`${routes.adminLogin}/`)
  );
}

export function isAuthPath(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}
