import { PwaExperience } from "@/components/pwa/pwa-experience";

import "@/styles/pour.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PwaExperience />
    </>
  );
}
