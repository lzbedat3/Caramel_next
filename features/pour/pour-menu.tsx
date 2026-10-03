import Image, { getImageProps } from "next/image";

import { siteConfig } from "@/config/site";
import { Ending } from "@/features/pour/ending";
import {
  PourStage,
  type StageDish,
  type StageImage,
} from "@/features/pour/pour-stage";
import { getDictionary } from "@/lib/i18n";
import {
  getWeekdayInTimeZone,
  getWeeklyHoursRows,
  isRestaurantOpen,
} from "@/lib/opening-hours";
import { formatPriceParts } from "@/lib/price";
import { isRemoteSvg } from "@/lib/storage-url";
import type { PublicHomeContent } from "@/services/public-home";

const RING_SIZES = "170px";
const DETAIL_SIZES = "(max-width: 460px) 100vw, 400px";
const PRIORITY_DISHES = 3;
const HEBREW_OR_ARABIC = /[֐-׿؀-ۿ]/;

function scriptClass(text: string): "heb" | "lat" {
  return HEBREW_OR_ARABIC.test(text) ? "heb" : "lat";
}

// "Caramel - קרמל" is shown as two words with the pour's source between them.
function brandParts(name: string): string[] {
  return name
    .split(/\s+[-–—·|]\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
}

function imageSources(
  src: string,
  width: number,
  height: number,
  sizes?: string,
): StageImage {
  const { props } = getImageProps({
    src,
    alt: "",
    width,
    height,
    sizes,
    unoptimized: isRemoteSvg(src),
  });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function PourMenu({
  profile,
  hours,
  categories,
  menuItems,
  socialLinks,
}: PublicHomeContent) {
  const strings = getDictionary();
  const name = profile?.name?.trim() || null;
  const subtitle = profile?.subtitle?.trim() || null;
  const brand = brandParts(name ?? siteConfig.name);
  const taglineWords = subtitle ? subtitle.split(/\s+/) : [];
  const now = new Date();
  const liveHours = profile ? hours : [];
  const isOpen = isRestaurantOpen(liveHours, now, siteConfig.timeZone);
  const hourRows = getWeeklyHoursRows(
    liveHours,
    getWeekdayInTimeZone(now, siteConfig.timeZone),
  );
  // Sides alternate; a left-to-right locale mirrors them.
  const sides: ["R", "L"] | ["L", "R"] =
    siteConfig.dir === "rtl" ? ["R", "L"] : ["L", "R"];

  const groups = (profile ? categories : []).map((category) => ({
    category,
    items: menuItems.filter((item) => item.categoryId === category.id),
  }));

  const dishes: StageDish[] = groups.flatMap(({ category, items }) =>
    items.map((item) => ({
      id: item.id,
      categoryName: category.name,
      name: item.name,
      description: item.shortDescription,
      value: item.price,
      price: formatPriceParts(item.price),
      isAvailable: item.isAvailable,
      detail: item.imageSrc
        ? imageSources(item.imageSrc, 800, 600, DETAIL_SIZES)
        : null,
      thumb: item.imageSrc ? imageSources(item.imageSrc, 128, 96) : null,
    })),
  );

  let position = 0;

  return (
    <PourStage
      dishes={dishes}
      categories={groups.map(({ category }) => ({
        id: category.id,
        name: category.name,
      }))}
      strings={strings}
      storageKey={`pour-table:${siteConfig.url}`}
      brand={brand}
    >
      <a
        href="#stage"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-black focus:px-4 focus:py-2 focus:text-sm"
      >
        {strings.skipToContent}
      </a>
      <noscript>
        <style>{".pour #stage{opacity:1}"}</style>
      </noscript>
      <main id="stage" data-menu={dishes.length > 0 ? "complete" : undefined}>
        <svg id="track" aria-hidden="true">
          <path
            id="trk"
            fill="none"
            stroke="rgba(255,206,140,.2)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="0.1 6.5"
          />
        </svg>
        <div id="rib" aria-hidden="true">
          <canvas id="dyn" />
        </div>
        <header id="hero">
          {siteConfig.eyebrow ? (
            <div className="eyebrow">{siteConfig.eyebrow}</div>
          ) : null}
          <h1 className="brand">
            <span className={scriptClass(brand[0] ?? "")}>{brand[0]}</span>
            <i id="dot" />
            {brand[1] ? (
              <span className={scriptClass(brand[1])}>{brand[1]}</span>
            ) : null}
          </h1>
          <div className="tag" id="tag">
            {taglineWords.length > 2 ? (
              <p>
                {taglineWords.slice(0, -1).join(" ")}
                <br />
                <b>{taglineWords.at(-1)}</b>
              </p>
            ) : subtitle ? (
              <p>{subtitle}</p>
            ) : null}
            {!profile ? (
              <small>{strings.menuUnavailable}</small>
            ) : liveHours.length > 0 ? (
              <small className="st" data-open={isOpen ? "" : undefined}>
                {isOpen ? strings.open : strings.closed}
              </small>
            ) : null}
          </div>
        </header>
        <div id="list">
          {groups.map(({ category, items }, categoryIndex) => (
            <div key={category.id} role="group" aria-label={category.name}>
              <section className="pool">
                <small>
                  {pad(categoryIndex + 1)} — {pad(items.length)}
                </small>
                <h2>{category.name}</h2>
              </section>
              {items.map((item, index) => {
                const side = sides[index % 2] ?? "R";
                const price = formatPriceParts(item.price);
                const priority = position++ < PRIORITY_DISHES;
                return (
                  <article
                    key={item.id}
                    className={`dish ${side}`}
                    data-side={side}
                    data-category={categoryIndex}
                    data-id={item.id}
                    data-noimg={item.imageSrc ? undefined : ""}
                    data-unavailable={item.isAvailable ? undefined : ""}
                  >
                    <button type="button" className="ph" aria-label={item.name}>
                      {item.imageSrc ? (
                        <Image
                          src={item.imageSrc}
                          alt=""
                          width={340}
                          height={255}
                          sizes={RING_SIZES}
                          quality={70}
                          priority={priority}
                          // Every ring photo loads straight away (about 15 KB each as WebP),
                          // so nothing appears late while the guest scrolls.
                          loading={priority ? undefined : "eager"}
                          unoptimized={isRemoteSvg(item.imageSrc)}
                        />
                      ) : null}
                      <span className="nm" aria-hidden="true">
                        {item.name}
                      </span>
                      <span className="dim" />
                      <span className="dome" />
                      <span className="sw" />
                    </button>
                    <div className="tx">
                      <div>
                        <h3>{item.name}</h3>
                        {price ? (
                          <span className="pr" dir="ltr">
                            <i>{price.symbol}</i>
                            {price.amount}
                          </span>
                        ) : null}
                        {item.isAvailable ? null : (
                          <span className="more">{strings.unavailable}</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
        <Ending
          name={name}
          subtitle={subtitle}
          about={profile?.about?.trim() || null}
          address={profile?.address?.trim() || null}
          wazeUrl={profile?.waze_url?.trim() || null}
          phone={profile?.phone?.trim() || null}
          hourRows={hourRows}
          isOpen={isOpen}
          socialLinks={profile ? socialLinks : []}
          strings={strings}
        />
      </main>
    </PourStage>
  );
}
