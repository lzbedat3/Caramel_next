"use client";

import { useEffect, useState } from "react";

import { AdminShellFrame } from "@/components/admin/admin-shell-frame";

type AdminShellProps = {
  children: React.ReactNode;
  restaurantName: string | null;
  userEmail: string | null;
};

export function AdminShell({
  children,
  restaurantName,
  userEmail,
}: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    function onChange() {
      setIsDesktop(media.matches);
      if (media.matches) {
        setMenuOpen(false);
      }
    }

    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", menuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [menuOpen]);

  return (
    <AdminShellFrame
      restaurantName={restaurantName}
      userEmail={userEmail}
      menuOpen={menuOpen}
      navHidden={isDesktop === false && !menuOpen}
      onOpenMenu={() => setMenuOpen(true)}
      onCloseMenu={() => setMenuOpen(false)}
    >
      {children}
    </AdminShellFrame>
  );
}
