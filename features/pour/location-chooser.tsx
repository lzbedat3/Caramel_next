import { PinIcon } from "@/components/icons";
import { brandAssets } from "@/config/brand-assets";
import { menuPath, type Locale } from "@/config/locales";
import { siteConfig } from "@/config/site";
import { LanguageSwitcher } from "@/features/pour/language-switcher";
import { OpenStatus } from "@/features/pour/live-hours";
import { getDictionary } from "@/lib/i18n";
import type { PublicHomeContent } from "@/services/public-home";

type LocationChooserProps = {
  locale: Locale;
  content: PublicHomeContent;
};

// The front door when there are several branches and the address names none:
// the logo, and one card per branch leading to its own menu. A QR code printed
// for a branch skips this and opens that branch directly.
export function LocationChooser({ locale, content }: LocationChooserProps) {
  const strings = getDictionary(locale);
  const name = content.profile?.name?.trim() || siteConfig.name;
  const renderedAt = new Date().getTime();

  return (
    <div className="pour pour-chooser">
      <div id="amb" />
      <LanguageSwitcher locale={locale} label={strings.language} />
      <main>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="seal" src={brandAssets.logo} alt={name} />
        <p className="eyebrow">{strings.eyebrow}</p>
        <h1>{strings.chooseBranch}</h1>
        <ul>
          {content.locations.map((location) => (
            <li key={location.id}>
              <a href={menuPath(locale, location.slug)}>
                <span className="pin" aria-hidden="true">
                  <PinIcon />
                </span>
                <span className="txt">
                  <b>{location.name}</b>
                  {location.address ? <small>{location.address}</small> : null}
                </span>
                {location.hours.length > 0 ? (
                  <OpenStatus
                    hours={location.hours}
                    renderedAt={renderedAt}
                    openLabel={strings.open}
                    closedLabel={strings.closed}
                  />
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
