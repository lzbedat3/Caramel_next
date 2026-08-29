"use client";

import { CloseIcon, MenuGlyphIcon } from "@/components/icons";
import { AdminNav } from "@/components/admin/admin-nav";
import { siteConfig } from "@/config/site";
import { SignOutButton } from "@/features/admin/sign-out-button";
import { cn } from "@/lib/cn";

type AdminShellProps = {
  children: React.ReactNode;
  restaurantName: string | null;
  userEmail: string | null;
  menuOpen: boolean;
  navHidden: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
};

export function AdminShellFrame({
  children,
  restaurantName,
  userEmail,
  menuOpen,
  navHidden,
  onOpenMenu,
  onCloseMenu,
}: AdminShellProps) {
  const contextName = restaurantName || siteConfig.nameLocalized;

  return (
    <div className="flex min-h-full flex-1 bg-background">
      {menuOpen ? (
        <button
          type="button"
          aria-label="סגירת התפריט"
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
          onClick={onCloseMenu}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        aria-hidden={navHidden}
        inert={navHidden}
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-border bg-surface-warm/90 px-4 py-5 shadow-soft transition-transform duration-200 lg:static lg:z-0 lg:translate-x-0 lg:shadow-none",
          menuOpen
            ? "translate-x-0"
            : "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-medium tracking-wide text-caramel-deep">
              ניהול
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {contextName}
            </p>
          </div>
          <button
            type="button"
            className="rounded-control p-2 text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            onClick={onCloseMenu}
            aria-label="סגירת הניווט"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNav onNavigate={onCloseMenu} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-control p-2 text-foreground transition hover:bg-surface-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
              onClick={onOpenMenu}
              aria-expanded={menuOpen}
              aria-controls="admin-sidebar"
              aria-label="פתיחת הניווט"
            >
              <MenuGlyphIcon />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {contextName}
              </p>
              {userEmail ? (
                <p className="truncate text-xs text-muted">{userEmail}</p>
              ) : (
                <p className="text-xs text-muted">מנהל מערכת</p>
              )}
            </div>
          </div>
          <SignOutButton />
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
