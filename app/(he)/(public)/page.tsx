import type { Metadata } from "next";

import { defaultLocale } from "@/config/locales";
import { MenuRoute, menuRouteMetadata } from "@/features/pour/menu-route";

// Served from cache. Admin saves refresh it at once (revalidatePath in the
// admin actions); the hourly pass only covers edits made outside the admin.
export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return menuRouteMetadata(defaultLocale);
}

export default function HomePage() {
  return <MenuRoute locale={defaultLocale} />;
}
