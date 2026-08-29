import type { Metadata } from "next";
import Link from "next/link";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "מיתוג ומדיה",
};

export default function AdminMediaPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        title="מיתוג ומדיה"
        description="הלוגו ומדיית העמוד הראשי מנוהלים במסכים הייעודיים. אין כאן העלאות נפרדות."
      />
      <ul className="flex flex-col gap-3 sm:max-w-xl">
        <li>
          <Link
            href={routes.adminProfile}
            className="block rounded-card border border-border bg-surface px-5 py-4 transition hover:border-caramel-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="text-sm font-medium text-foreground">לוגו המסעדה</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              העלאה והסרה של הלוגו מתוך פרופיל המסעדה.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href={routes.adminHero}
            className="block rounded-card border border-border bg-surface px-5 py-4 transition hover:border-caramel-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="text-sm font-medium text-foreground">מדיה ראשית</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              תמונות וסרטונים של העמוד הראשי, כולל סדר ותצוגה.
            </p>
          </Link>
        </li>
      </ul>
    </AdminPage>
  );
}
