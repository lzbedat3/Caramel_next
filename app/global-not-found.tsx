import type { Metadata } from "next";

import { StatusScreen } from "@/components/feedback/status-screen";
import { RootDocument } from "@/components/layout/root-document";
import { ButtonLink } from "@/components/ui/button";
import { defaultLocale } from "@/config/locales";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "הדף לא נמצא",
  robots: { index: false, follow: false },
};

// Addresses that match no route at all. The app has one root layout per
// language group, so this page brings its own document.
export default function GlobalNotFound() {
  return (
    <RootDocument locale={defaultLocale}>
      <StatusScreen
        title="הדף לא נמצא"
        description="הכתובת הזו לא מובילה לתוכן קיים באתר קרמל."
        action={<ButtonLink href={routes.home}>חזרה לדף הבית</ButtonLink>}
      />
    </RootDocument>
  );
}
