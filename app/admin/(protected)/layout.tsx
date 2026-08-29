import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminAccessDenied } from "@/features/admin/admin-access-denied";
import { getAdminAccess } from "@/lib/auth/session";
import { getAdminShellContext } from "@/services/admin-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") {
    notFound();
  }

  if (access.status === "forbidden") {
    return <AdminAccessDenied email={access.claims.email} />;
  }

  const shell = await getAdminShellContext();

  return (
    <AdminShell
      restaurantName={shell.restaurantName}
      userEmail={access.claims.email}
    >
      {children}
    </AdminShell>
  );
}
