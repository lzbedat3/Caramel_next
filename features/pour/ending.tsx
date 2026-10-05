import { GlobeIcon, LinkIcon, PhoneIcon, PinIcon } from "@/components/icons";
import {
  FacebookMark,
  InstagramMark,
  TikTokMark,
  WazeMark,
  WhatsAppMark,
  XMark,
  YouTubeMark,
} from "@/components/icons/brands";
import type { Locale } from "@/config/locales";
import { siteConfig } from "@/config/site";
import { HoursDetails } from "@/features/pour/live-hours";
import { format, type Dictionary } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";
import type { OpeningHour } from "@/lib/opening-hours";
import type { PublicFooter } from "@/services/public-home";
import { toTelHref } from "@/lib/phone";
import {
  socialLabel,
  type PublicSocialLink,
  type SocialPlatform,
} from "@/lib/social";

type EndingProps = {
  name: string | null;
  subtitle: string | null;
  about: string | null;
  address: string | null;
  wazeUrl: string | null;
  phone: string | null;
  hours: OpeningHour[];
  renderedAt: number;
  locale: Locale;
  logoSrc: string;
  /** Every branch, shown only when there is more than one. */
  branches: { name: string; href: string; current: boolean }[];
  socialLinks: PublicSocialLink[];
  footer: PublicFooter;
  strings: Dictionary;
};

const SOCIAL_MARKS: Record<
  SocialPlatform,
  React.ComponentType<{ className?: string }>
> = {
  instagram: InstagramMark,
  facebook: FacebookMark,
  tiktok: TikTokMark,
  whatsapp: WhatsAppMark,
  youtube: YouTubeMark,
  x: XMark,
  website: GlobeIcon,
  other: LinkIcon,
};

// A small glossy heart in the caramel of the pour.
function CaramelHeart() {
  return (
    <svg className="heart" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="heart-caramel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a0" />
          <stop offset="0.5" stopColor="#e9a43a" />
          <stop offset="1" stopColor="#8a430a" />
        </linearGradient>
      </defs>
      <path
        d="M12 21.2s-7.6-4.7-9.7-9.3C.8 8.5 3 4.6 6.8 4.6c2 0 3.6 1.1 4.4 2.6.8-1.5 2.4-2.6 4.4-2.6 3.8 0 6 3.9 4.5 7.3-1.4 3.2-5.3 6.4-7.4 8.1-.4.3-.5.9-.2 1.3.1.2 0 .4-.2.4-.2 0-.3-.2-.3-.5z"
        fill="url(#heart-caramel)"
      />
      <path
        d="M6.6 7.6c.9-1 2.3-1.3 3.4-.8"
        fill="none"
        stroke="#fff0cc"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

function phoneLabel(phone: string): string {
  return phone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");
}

// The last pool and everything a guest needs after choosing: where, when, how to reach.
export function Ending({
  name,
  subtitle,
  about,
  address,
  wazeUrl,
  phone,
  hours,
  renderedAt,
  locale,
  logoSrc,
  branches,
  socialLinks,
  footer,
  strings,
}: EndingProps) {
  return (
    <footer id="foot">
      <div className="bye">
        <h2>{strings.enjoy}</h2>
        {locale === "en" ? null : <small>{en.enjoy.toUpperCase()}</small>}
      </div>
      <div className="sig" id="sig">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="seal"
          src={logoSrc}
          alt={name ?? siteConfig.name}
          width={120}
          height={120}
          loading="lazy"
          decoding="async"
        />
        {name ? <b>{name}</b> : null}
        {subtitle ? (
          <>
            <br />
            {subtitle}
          </>
        ) : null}
        {about ? <p className="about">{about}</p> : null}
        <div id="lnk">
          {address ? (
            <div className="adr">
              <PinIcon />
              {address}
            </div>
          ) : null}
          {wazeUrl ? (
            <a
              className="go"
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WazeMark />
              {strings.navigateWaze}
            </a>
          ) : null}
          {phone ? (
            <a
              className="tel"
              href={toTelHref(phone)}
              aria-label={`${strings.phone} ${phone}`}
            >
              <PhoneIcon />
              {phoneLabel(phone)}
            </a>
          ) : null}
          <HoursDetails
            hours={hours}
            renderedAt={renderedAt}
            locale={locale}
            strings={{
              hours: strings.hours,
              open: strings.open,
              closed: strings.closed,
              closedDay: strings.closedDay,
            }}
          />
          {branches.length > 0 ? (
            <nav className="brs" aria-label={strings.otherBranches}>
              <span>{strings.otherBranches}</span>
              {branches.map((branch) => (
                <a
                  key={branch.href}
                  href={branch.href}
                  aria-current={branch.current ? "page" : undefined}
                >
                  {branch.name}
                </a>
              ))}
            </nav>
          ) : null}
          {socialLinks.length > 0 ? (
            <div className="soc">
              {socialLinks.map((link) => {
                const Mark = SOCIAL_MARKS[link.platform] ?? LinkIcon;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialLabel(link.platform)}
                  >
                    <Mark />
                  </a>
                );
              })}
            </div>
          ) : null}
          <div id="install-slot" className="inst" />
          {footer.creditName ? (
            <div className="cr">
              {format(strings.rights, { year: new Date().getFullYear() })}
              {footer.creditUrl ? (
                <a
                  href={footer.creditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                >
                  {footer.creditName}
                </a>
              ) : (
                <span dir="ltr">{footer.creditName}</span>
              )}
            </div>
          ) : null}
          {footer.dedicationBy || footer.dedicationTo ? (
            <div className="ded">
              {footer.dedicationBy ? (
                <p>
                  {strings.madeWithLove} <b>{footer.dedicationBy}</b>
                </p>
              ) : null}
              {footer.dedicationTo ? (
                <p className="to">
                  {footer.dedicationTo} <CaramelHeart />
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
