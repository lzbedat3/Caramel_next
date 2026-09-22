"use client";

import { useEffect, useId, useRef } from "react";

import { LazyFadeImage } from "@/components/media/lazy-fade-image";
import { CloseIcon } from "@/components/icons";
import { catalogImageLoader } from "@/lib/media/catalog-image";
import {
  MENU_CARD_IMAGE_SIZES,
  MENU_MODAL_IMAGE_SIZES,
} from "@/lib/media/web-image";
import { formatPriceIls } from "@/lib/price";
import { isRemoteSvg } from "@/lib/storage-url";
import type { PublicMenuItem } from "@/lib/public-content";

type MenuItemModalProps = {
  item: PublicMenuItem;
  onClose: () => void;
  position: number;
  total: number;
  onPrevious?: () => void;
  onNext?: () => void;
};

export function MenuItemModal({
  item,
  onClose,
  position,
  total,
  onPrevious,
  onNext,
}: MenuItemModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const price = formatPriceIls(item.price);
  const description = item.shortDescription?.trim() || null;
  const imageSrc = item.imageSrc;
  const remoteSvg = Boolean(imageSrc && isRemoteSvg(imageSrc));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    const onCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", onCancel);
    document.body.classList.add("overflow-hidden");

    return () => {
      dialog.removeEventListener("cancel", onCancel);
      document.body.classList.remove("overflow-hidden");
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="menu-item-dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <article className="bg-espresso text-surface relative grid max-h-[min(40rem,92svh)] w-full overflow-y-auto sm:max-h-[min(32rem,88svh)] sm:grid-cols-[minmax(0,1.05fr)_minmax(16rem,0.95fr)]">
        <div
          key={item.id}
          className="relative aspect-[4/3] min-h-0 sm:aspect-auto sm:h-full"
        >
          {imageSrc ? (
            <>
              <LazyFadeImage
                src={imageSrc}
                alt=""
                sizes={MENU_CARD_IMAGE_SIZES}
                fit="cover"
                fade={false}
                eager
                loader={remoteSvg ? undefined : catalogImageLoader}
                unoptimized={remoteSvg}
              />
              {remoteSvg ? null : (
                <LazyFadeImage
                  src={imageSrc}
                  alt={item.name}
                  sizes={MENU_MODAL_IMAGE_SIZES}
                  fit="cover"
                  eager
                  loader={catalogImageLoader}
                  fetchPriority="high"
                />
              )}
            </>
          ) : (
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--caramel-soft),transparent_42%),linear-gradient(145deg,var(--caramel),var(--caramel-deep),var(--espresso))]"
              aria-hidden="true"
            />
          )}
          <div
            className="from-espresso/80 via-espresso/10 sm:from-espresso/35 pointer-events-none absolute inset-0 bg-gradient-to-t to-black/15 sm:bg-gradient-to-l sm:via-transparent sm:to-black/20"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={onClose}
            className="bg-espresso/55 text-surface hover:bg-espresso focus-visible:ring-caramel-soft absolute end-3 top-3 z-10 rounded-full p-2.5 backdrop-blur-md transition focus-visible:ring-2 focus-visible:outline-none sm:end-4 sm:top-4"
            aria-label="סגירה"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="text-foreground relative flex flex-col justify-between gap-6 bg-gradient-to-b from-[#fffdf9] to-[#eee8dc] px-6 py-6 sm:px-8 sm:py-9">
          <div>
            <p className="text-caramel-deep text-[0.7rem] font-semibold tracking-[0.22em]">
              מטבח ללא גלוטן
            </p>
            <h2
              id={titleId}
              className="font-display text-espresso mt-3 text-3xl leading-tight sm:text-4xl"
            >
              {item.name}
            </h2>
            {description ? (
              <p className="text-muted mt-4 max-w-sm text-base leading-7">
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-4">
            {price ? (
              <p className="font-display text-caramel-deep text-3xl leading-none sm:text-4xl">
                {price}
              </p>
            ) : (
              <span />
            )}
            {!item.isAvailable ? (
              <span className="rounded-pill bg-closed-soft text-closed px-3 py-1.5 text-xs font-medium tracking-wide">
                לא זמין כרגע
              </span>
            ) : null}
          </div>
          <nav
            aria-label="דפדוף במנות"
            className="border-border flex items-center justify-between gap-3 border-t pt-4"
          >
            <button
              type="button"
              onClick={onPrevious}
              disabled={!onPrevious}
              className="border-border hover:bg-caramel-soft focus-visible:outline-caramel rounded-full border px-4 py-2 text-sm transition focus-visible:outline-2 disabled:opacity-30"
            >
              → הקודמת
            </button>
            <span
              className="text-muted text-xs tabular-nums"
              aria-live="polite"
            >
              {position} / {total}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              className="bg-espresso text-surface hover:bg-caramel-deep focus-visible:outline-caramel rounded-full px-4 py-2 text-sm transition focus-visible:outline-2 disabled:opacity-30"
            >
              הבאה ←
            </button>
          </nav>
        </div>
      </article>
    </dialog>
  );
}
