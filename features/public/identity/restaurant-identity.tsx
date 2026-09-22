import { PinIcon } from "@/components/icons";
import { Container } from "@/components/ui/container";
import { publicIdentitySeamClassName } from "@/components/public/hero-frame";
import { PublicHeading } from "@/components/public/heading";
import { OpenStatus } from "@/features/public/identity/open-status";
import { RestaurantMark } from "@/features/public/identity/restaurant-mark";
import type { OpeningHour } from "@/lib/opening-hours";
import type { Tables } from "@/types/database";

type RestaurantIdentityProps = {
  profile: Tables<"restaurant_profile"> | null;
  hours: OpeningHour[];
  logoSrc?: string | null;
};

export function RestaurantIdentity({
  profile,
  hours,
  logoSrc,
}: RestaurantIdentityProps) {
  const name = profile?.name?.trim() || null;
  const subtitle = profile?.subtitle?.trim() || null;
  const address = profile?.address?.trim() || null;
  const wazeUrl = profile?.waze_url?.trim() || null;

  return (
    <Container className="relative z-10">
      <div className={publicIdentitySeamClassName}>
        <RestaurantMark name={name} logoSrc={logoSrc} />
        <div className="min-w-0">
          <OpenStatus hours={hours} />
        </div>
      </div>

      <div className="identity-copy mt-2 max-w-xl pb-3">
        {name ? (
          <PublicHeading className="reveal-up text-2xl sm:text-3xl lg:text-4xl">
            {name}
          </PublicHeading>
        ) : (
          <h1 className="sr-only">מסעדה</h1>
        )}

        {subtitle ? (
          <p className="reveal-up reveal-up-delay text-muted mt-1 text-sm leading-5">
            {subtitle}
          </p>
        ) : null}

        {!name && !subtitle ? (
          <p className="text-muted mt-3 text-lg leading-8">
            פרטי המסעדה יופיעו כאן כשיתעדכנו במערכת
          </p>
        ) : null}

        {address && wazeUrl ? (
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="reveal-up reveal-up-delay-2 rounded-pill text-foreground decoration-caramel-soft hover:text-caramel-deep focus-visible:ring-ring mt-2 inline-flex items-start gap-2 text-xs underline underline-offset-[0.35em] transition focus-visible:ring-2 focus-visible:outline-none"
            aria-label={`ניווט ל${address} ב-Waze`}
          >
            <PinIcon className="text-caramel-deep mt-0.5 size-5 shrink-0" />
            <span>{address}</span>
          </a>
        ) : address ? (
          <p className="reveal-up reveal-up-delay-2 text-foreground mt-2 inline-flex items-start gap-2 text-xs">
            <PinIcon className="text-caramel-deep mt-0.5 size-5 shrink-0" />
            <span>{address}</span>
          </p>
        ) : null}
      </div>
    </Container>
  );
}
