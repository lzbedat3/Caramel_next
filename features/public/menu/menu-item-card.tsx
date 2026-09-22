"use client";

import { NearbyMedia } from "@/components/media/nearby-media";
import { LazyFadeImage } from "@/components/media/lazy-fade-image";
import { InViewFade } from "@/components/public/in-view-fade";
import { cn } from "@/lib/cn";
import {
  catalogImageLoader,
  prefetchMenuModalImage,
} from "@/lib/media/catalog-image";
import { MENU_CARD_IMAGE_SIZES } from "@/lib/media/web-image";
import { formatPriceIls } from "@/lib/price";
import { isRemoteSvg } from "@/lib/storage-url";
import type { PublicMenuItem } from "@/lib/public-content";

type MenuItemCardProps = {
  item: PublicMenuItem;
  onSelect: () => void;
  immediate?: boolean;
};

function MenuItemImage({
  item,
  immediate,
}: {
  item: PublicMenuItem;
  immediate?: boolean;
}) {
  return (
    <div className="bg-surface-warm relative aspect-[4/3] w-full">
      {item.imageSrc ? (
        <NearbyMedia immediate={immediate}>
          <LazyFadeImage
            src={item.imageSrc}
            alt=""
            sizes={MENU_CARD_IMAGE_SIZES}
            fit="cover"
            loader={isRemoteSvg(item.imageSrc) ? undefined : catalogImageLoader}
            className={cn(!item.isAvailable && "opacity-60")}
            unoptimized={isRemoteSvg(item.imageSrc)}
          />
        </NearbyMedia>
      ) : (
        <div
          className="from-surface via-caramel-soft to-caramel absolute inset-0 bg-gradient-to-br"
          aria-hidden="true"
        />
      )}
      {!item.isAvailable ? (
        <span className="rounded-pill bg-surface/90 text-muted absolute start-1 bottom-1 px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide">
          לא זמין כרגע
        </span>
      ) : null}
    </div>
  );
}

export function MenuItemCard({ item, onSelect, immediate }: MenuItemCardProps) {
  const price = formatPriceIls(item.price);
  const description = item.shortDescription?.trim() || null;

  function prefetchModalImage() {
    if (item.imageSrc && !isRemoteSvg(item.imageSrc)) {
      prefetchMenuModalImage(item.imageSrc);
    }
  }

  return (
    <InViewFade className="h-full min-w-0">
      <article className={cn("h-full", !item.isAvailable && "opacity-90")}>
        <button
          type="button"
          onClick={onSelect}
          onPointerDown={prefetchModalImage}
          onFocus={prefetchModalImage}
          aria-haspopup="dialog"
          className="menu-card group border-border bg-surface motion-safe:hover:shadow-lift focus-visible:ring-ring flex h-full w-full flex-col overflow-hidden rounded-[1rem] border text-start transition duration-300 ease-out focus-visible:ring-2 focus-visible:outline-none motion-safe:hover:-translate-y-1 motion-safe:active:scale-[0.98]"
        >
          <MenuItemImage item={item} immediate={immediate} />
          <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3">
            <h3 className="text-foreground text-sm leading-5 font-semibold break-words">
              {item.name}
            </h3>
            {price ? (
              <p className="text-caramel-deep text-sm leading-5 font-semibold tabular-nums">
                {price}
              </p>
            ) : null}
            {description ? (
              <p className="text-muted line-clamp-1 text-[11px] leading-4">
                {description}
              </p>
            ) : null}
          </div>
        </button>
      </article>
    </InViewFade>
  );
}
