import {
  ClockIcon,
  GlobeIcon,
  LinkIcon,
  PhoneIcon,
  PinIcon,
} from "@/components/icons";
import {
  FacebookMark,
  InstagramMark,
  TikTokMark,
  WazeMark,
  WhatsAppMark,
  XMark,
  YouTubeMark,
} from "@/components/icons/brands";
import { siteConfig } from "@/config/site";
import { format, type Dictionary } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";
import { WEEKDAYS, type WeekdayHoursRow } from "@/lib/opening-hours";
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
  hourRows: WeekdayHoursRow[];
  isOpen: boolean;
  socialLinks: PublicSocialLink[];
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

const weekdayName = new Intl.DateTimeFormat(siteConfig.locale, {
  weekday: "long",
  timeZone: "UTC",
});

// 7 January 2024 was a Sunday, the first entry of WEEKDAYS.
function weekdayLabel(row: WeekdayHoursRow): string {
  const offset = Math.max(0, WEEKDAYS.indexOf(row.day));
  return weekdayName.format(new Date(Date.UTC(2024, 0, 7 + offset)));
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
  hourRows,
  isOpen,
  socialLinks,
  strings,
}: EndingProps) {
  const today = hourRows.find((row) => row.isToday);
  const todayText = today
    ? today.isClosed
      ? strings.closedDay
      : today.ranges.join(" · ")
    : null;
  const { credit } = siteConfig;
  const locale: string = siteConfig.locale;

  return (
    <footer id="foot">
      <div className="bye">
        <h2>{strings.enjoy}</h2>
        {locale === "en" ? null : <small>{en.enjoy.toUpperCase()}</small>}
      </div>
      <div className="sig" id="sig">
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
          {hourRows.length > 0 ? (
            <details className="hrs">
              <summary>
                <ClockIcon />
                <span className="lb">{strings.hours}</span>
                {todayText ? <span className="td">{todayText}</span> : null}
                <span className="st" data-open={isOpen ? "" : undefined}>
                  {isOpen ? strings.open : strings.closed}
                </span>
              </summary>
              <ul>
                {hourRows.map((row) => (
                  <li key={row.day} data-today={row.isToday ? "" : undefined}>
                    <span>{weekdayLabel(row)}</span>
                    <span>
                      {row.isClosed
                        ? strings.closedDay
                        : row.ranges.join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
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
          <div className="cr">
            {format(strings.rights, { year: new Date().getFullYear() })}
            <a
              href={credit.url}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
            >
              {credit.name}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
