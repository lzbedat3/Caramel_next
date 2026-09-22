import { PwaExperience } from "@/components/pwa/pwa-experience";

import { PublicShell } from "@/components/layout/public-shell";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicShell>
      {children}
      <PwaExperience />
    </PublicShell>
  );
}
