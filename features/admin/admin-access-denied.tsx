import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { SignOutButton } from "@/features/admin/sign-out-button";

type AdminAccessDeniedProps = {
  email: string | null;
};

export function AdminAccessDenied({ email }: AdminAccessDeniedProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-medium text-caramel-deep">אין הרשאה</p>
      <h1 className="mt-3 text-3xl font-semibold text-foreground">
        אין גישה לפורטל הניהול
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-muted">
        החשבון מחובר
        {email ? ` (${email})` : ""} אך אינו מוגדר כמנהל. פנו לבעלי המסעדה אם
        זו טעות.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href={routes.home} variant="outline">
          חזרה לאתר
        </ButtonLink>
        <SignOutButton />
      </div>
    </main>
  );
}
