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

      <div className="mt-7 max-w-xl pb-8 sm:mt-8 sm:pb-10">
        {name ? (
          <PublicHeading className="reveal-up">{name}</PublicHeading>
        ) : (
          <h1 className="sr-only">מסעדה</h1>
        )}

        {subtitle ? (
          <p className="reveal-up reveal-up-delay mt-3 text-lg leading-8 text-muted sm:text-xl">
            {subtitle}
          </p>
        ) : null}

        {!name && !subtitle ? (
          <p className="mt-3 text-lg leading-8 text-muted">
            פרטי המסעדה יופיעו כאן כשיתעדכנו במערכת
          </p>
        ) : null}

        {address && wazeUrl ? (
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="reveal-up reveal-up-delay-2 mt-5 inline-flex items-start gap-2 rounded-pill text-base text-foreground underline decoration-caramel-soft underline-offset-[0.35em] transition hover:text-caramel-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`ניווט ל${address} ב-Waze`}
          >
            <PinIcon className="mt-0.5 size-5 shrink-0 text-caramel-deep" />
            <span>{address}</span>
          </a>
        ) : address ? (
          <p className="reveal-up reveal-up-delay-2 mt-5 inline-flex items-start gap-2 text-base text-foreground">
            <PinIcon className="mt-0.5 size-5 shrink-0 text-caramel-deep" />
            <span>{address}</span>
          </p>
        ) : null}
      </div>
    </Container>
  );
}
