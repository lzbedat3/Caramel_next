import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { StatusScreen } from "@/components/feedback/status-screen";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "שגיאת התחברות",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthErrorPage() {
  return (
    <StatusScreen
      title="ההתחברות לא הושלמה"
      description="לא הצלחנו לאשר את הסשן. אפשר לנסות להיכנס שוב."
      action={<ButtonLink href={routes.portal}>חזרה לכניסה</ButtonLink>}
    />
  );
}
