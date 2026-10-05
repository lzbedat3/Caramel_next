import type { Metadata } from "next";
import Link from "next/link";

import { brandAssets } from "@/config/brand-assets";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { LoginForm } from "@/features/admin/login-form";
import { PortalPour } from "@/features/admin/portal-pour";

type PortalPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export const metadata: Metadata = {
  title: "כניסה",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PortalPage({ searchParams }: PortalPageProps) {
  const { next } = await searchParams;

  return (
    <main id="content" className="portal">
      <div className="portal-amb" />
      <PortalPour />
      <Link href={routes.home} className="portal-back">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        חזרה לתפריט
      </Link>
      <div className="portal-col">
        <div className="portal-logo" data-pour-target>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandAssets.logo} alt={siteConfig.name} />
        </div>
        <p className="portal-eyebrow">ניהול התפריט</p>
        <h1>כניסה</h1>
        <div className="portal-card">
          <LoginForm nextPath={next} />
        </div>
        <p className="portal-note">הכניסה מיועדת לצוות בלבד</p>
      </div>
    </main>
  );
}
