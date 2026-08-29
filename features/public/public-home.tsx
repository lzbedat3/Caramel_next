import { PublicSection } from "@/components/public/section";
import { publicHeroFrameClassName } from "@/components/public/hero-frame";
import { PublicBrowse } from "@/features/public/browse/public-browse";
import { PublicFooter } from "@/features/public/footer/public-footer";
import { HeroFallback } from "@/features/public/hero/hero-fallback";
import { HeroMediaStage } from "@/features/public/hero/hero-media-stage";
import { RestaurantIdentity } from "@/features/public/identity/restaurant-identity";
import { AboutSection } from "@/features/public/story/about-section";
import { VenueSection } from "@/features/public/venue/venue-section";
import { siteConfig } from "@/config/site";
import type { CategorySelection } from "@/lib/category-nav";
import {
  getWeekdayInTimeZone,
  getWeeklyHoursRows,
} from "@/lib/opening-hours";
import { cn } from "@/lib/cn";
import type { PublicHomeContent } from "@/services/public-home";

type PublicHomeProps = PublicHomeContent & {
  selectedCategory: CategorySelection;
};

export function PublicHome({
  profile,
  hours,
  heroSlides,
  logoSrc,
  categories,
  menuItems,
  socialLinks,
  selectedCategory,
}: PublicHomeProps) {
  const isLive = Boolean(profile);
  const name = profile?.name?.trim() || null;
  const about = profile?.about?.trim() || null;
  const address = profile?.address?.trim() || null;
  const wazeUrl = profile?.waze_url?.trim() || null;
  const phone = profile?.phone?.trim() || null;
  const today = getWeekdayInTimeZone(new Date(), siteConfig.timeZone);
  const hourRows = isLive ? getWeeklyHoursRows(hours, today) : [];
  const hasVenue = Boolean(address || wazeUrl || hourRows.length);
  const hasClosing = Boolean(about || hasVenue);
  const liveCategories = isLive ? categories : [];
  const liveMenuItems = isLive ? menuItems : [];
  const liveSocial = isLive ? socialLinks : [];

  return (
    <>
      <main id="content" className="flex-1">
        <PublicSection bleed aria-label="מדיה ראשית">
          <div className={publicHeroFrameClassName}>
            {heroSlides.length > 0 && isLive ? (
              <HeroMediaStage slides={heroSlides} />
            ) : (
              <HeroFallback />
            )}
          </div>
        </PublicSection>
        <RestaurantIdentity
          profile={profile}
          hours={isLive ? hours : []}
          logoSrc={isLive ? logoSrc : null}
        />
        {isLive ? (
          <PublicBrowse
            categories={liveCategories}
            menuItems={liveMenuItems}
            selectedCategory={selectedCategory}
          />
        ) : null}
        {isLive && hasClosing ? (
          <div className="pt-10 sm:pt-14">
            {about ? <AboutSection name={name} about={about} /> : null}
            <VenueSection
              address={address}
              wazeUrl={wazeUrl}
              hourRows={hourRows}
            />
          </div>
        ) : null}
      </main>
      <PublicFooter
        name={name}
        logoSrc={isLive ? logoSrc : null}
        phone={phone}
        socialLinks={liveSocial}
        className={cn(!isLive && "mt-8")}
      />
    </>
  );
}
