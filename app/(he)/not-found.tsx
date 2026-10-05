import { ButtonLink } from "@/components/ui/button";
import { StatusScreen } from "@/components/feedback/status-screen";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <StatusScreen
      title="הדף לא נמצא"
      description="הכתובת הזו לא מובילה לתוכן קיים באתר קרמל."
      action={<ButtonLink href={routes.home}>חזרה לדף הבית</ButtonLink>}
    />
  );
}
