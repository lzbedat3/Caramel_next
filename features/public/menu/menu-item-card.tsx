"use client";

import { LazyFadeImage } from "@/components/media/lazy-fade-image";
import { InViewFade } from "@/components/public/in-view-fade";
import { cn } from "@/lib/cn";
import { formatPriceIls } from "@/lib/price";
import { isRemoteSvg } from "@/lib/storage-url";
import type { PublicMenuItem } from "@/lib/public-content";

type MenuItemCardProps = {
  item: PublicMenuItem;
  onSelect: () => void;
};

function MenuItemImage({ item }: { item: PublicMenuItem }) {
  return (
    <div className="relative aspect-square w-full bg-surface-warm">
      {item.imageSrc ? (
        <LazyFadeImage
          src={item.imageSrc}
          alt=""
          sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 25vw, (min-width: 768px) 28vw, 30vw"
          fit="fill"
          className={cn(!item.isAvailable && "opacity-60")}
          unoptimized={isRemoteSvg(item.imageSrc)}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-surface via-caramel-soft to-caramel"
          aria-hidden="true"
        />
      )}
      {!item.isAvailable ? (
        <span className="absolute start-1 bottom-1 rounded-pill bg-surface/90 px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide text-muted">
          לא זמין כרגע
        </span>
      ) : null}
    </div>
  );
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const price = formatPriceIls(item.price);
  const description = item.shortDescription?.trim() || null;

  return (
    <InViewFade className="min-w-0">
      <article className={cn(!item.isAvailable && "opacity-90")}>
        <button
          type="button"
          onClick={onSelect}
          aria-haspopup="dialog"
          className="group flex w-full flex-col overflow-hidden rounded-[1.05rem] border border-foreground/20 text-start transition duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.98]"
        >
          <MenuItemImage item={item} />
          <div className="flex flex-col justify-center gap-px border-t border-foreground/20 bg-surface px-1.5 py-1.5">
            <h3 className="line-clamp-2 text-[0.7rem] leading-3.5 font-medium break-words text-foreground">
              {item.name}
            </h3>
            {price ? (
              <p className="text-[0.7rem] leading-3.5 font-semibold text-caramel-deep">
                {price}
              </p>
            ) : null}
            {description ? (
              <p className="line-clamp-1 text-[0.62rem] leading-3.5 text-muted">
                {description}
              </p>
            ) : null}
          </div>
        </button>
      </article>
    </InViewFade>
  );
}
