import { PwaExperience } from "@/components/pwa/pwa-experience";
import { defaultLocale } from "@/config/locales";
import { RememberLanguage } from "@/features/pour/remember-language";

import "@/styles/pour.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RememberLanguage />
      {children}
      <PwaExperience locale={defaultLocale} />
    </>
  );
}
