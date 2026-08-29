import { HeartIcon, PhoneIcon } from "@/components/icons";
import { LazyFadeImage } from "@/components/media/lazy-fade-image";
import { Container } from "@/components/ui/container";
import { SocialLinks } from "@/features/public/social/social-links";
import { toTelHref } from "@/lib/phone";
import { cn } from "@/lib/cn";
import type { PublicSocialLink } from "@/lib/social";
import { isRemoteSvg } from "@/lib/storage-url";

type PublicFooterProps = {
  name: string | null;
  logoSrc: string | null;
  phone: string | null;
  socialLinks: PublicSocialLink[];
  className?: string;
};

function Dedication() {
  return (
    <div className="border-t border-white/10">
      <Container className="flex flex-col items-center gap-2 py-6 text-center sm:py-7">
        <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm leading-6 text-surface/90">
          <span>נוצר בכל</span>
          <HeartIcon className="dedication-heart size-3.5 text-[#e11d48]" />
          <span className="sr-only">אהבה</span>
          <span>על ידי</span>
          <span className="font-medium tracking-wide text-surface">
            נור &amp; למא
          </span>
        </p>
        <p className="max-w-md text-xs leading-6 text-caramel-soft/80 sm:text-[0.8rem]">
          למחמוד — שכל אורח אצלו מרגיש בבית.
        </p>
      </Container>
    </div>
  );
}

export function PublicFooter({
  name,
  logoSrc,
  phone,
  socialLinks,
  className,
}: PublicFooterProps) {
  const initial = name?.trim().charAt(0) ?? "";
  const hasContent = Boolean(
    name || logoSrc || phone || socialLinks.length,
  );

  if (!hasContent) {
    return (
      <footer
        className={cn(
          "mt-auto border-t border-white/10 bg-gradient-to-b from-espresso to-espresso-deep text-surface",
          className,
        )}
      >
        <Dedication />
      </footer>
    );
  }

  return (
    <footer
      className={cn(
        "mt-auto border-t border-white/10 bg-gradient-to-b from-espresso to-espresso-deep text-surface",
        className,
      )}
    >
      <Container className="flex flex-col gap-8 py-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "relative flex size-14 items-center justify-center overflow-hidden rounded-full bg-surface shadow-soft",
              )}
            >
              {logoSrc ? (
                <LazyFadeImage
                  src={logoSrc}
                  alt={name ? `לוגו ${name}` : "לוגו המסעדה"}
                  sizes="56px"
                  unoptimized={isRemoteSvg(logoSrc)}
                />
              ) : initial ? (
                <span className="font-display text-xl text-caramel-deep">
                  {initial}
                </span>
              ) : (
                <span className="size-6 rounded-full bg-caramel-soft/80" />
              )}
            </div>
            {name ? (
              <p className="font-display text-2xl text-surface">{name}</p>
            ) : null}
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-caramel-soft">
            מטבח ללא גלוטן — בלי פשרות על הטעם
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
          {phone ? (
            <a
              href={toTelHref(phone)}
              className="inline-flex items-center gap-2 rounded-pill text-surface transition hover:text-caramel-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-soft"
            >
              <PhoneIcon className="size-5 text-caramel-soft" />
              <span>{phone}</span>
            </a>
          ) : null}
          <SocialLinks links={socialLinks} />
        </div>
      </Container>
      <Dedication />
    </footer>
  );
}
