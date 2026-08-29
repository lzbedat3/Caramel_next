"use client";

import { useEffect, useId, useRef } from "react";

import { LazyFadeImage } from "@/components/media/lazy-fade-image";
import { CloseIcon } from "@/components/icons";
import { formatPriceIls } from "@/lib/price";
import { isRemoteSvg } from "@/lib/storage-url";
import type { PublicMenuItem } from "@/lib/public-content";

type MenuItemModalProps = {
  item: PublicMenuItem;
  onClose: () => void;
};

export function MenuItemModal({ item, onClose }: MenuItemModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const price = formatPriceIls(item.price);
  const description = item.shortDescription?.trim() || null;

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
      <article className="relative grid max-h-[min(40rem,92svh)] w-full overflow-hidden bg-espresso text-surface sm:max-h-[min(32rem,88svh)] sm:grid-cols-[minmax(0,1.05fr)_minmax(16rem,0.95fr)]">
        <div className="relative aspect-[4/3] min-h-0 sm:aspect-auto sm:h-full">
          {item.imageSrc ? (
            <LazyFadeImage
              src={item.imageSrc}
              alt={item.name}
              sizes="(min-width: 640px) 50vw, 100vw"
              unoptimized={isRemoteSvg(item.imageSrc)}
              eager
            />
          ) : (
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--caramel-soft),transparent_42%),linear-gradient(145deg,var(--caramel),var(--caramel-deep),var(--espresso))]"
              aria-hidden="true"
            />
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/10 to-black/15 sm:bg-gradient-to-l sm:from-espresso/35 sm:via-transparent sm:to-black/20"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute end-3 top-3 z-10 rounded-full bg-espresso/55 p-2.5 text-surface backdrop-blur-md transition hover:bg-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-soft sm:end-4 sm:top-4"
            aria-label="סגירה"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="relative flex flex-col justify-between gap-6 bg-gradient-to-b from-[#fff8ec] to-[#ffe7c2] px-6 py-6 text-foreground sm:px-8 sm:py-9">
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-caramel-deep">
              מטבח ללא גלוטן
            </p>
            <h2
              id={titleId}
              className="font-display mt-3 text-3xl leading-tight text-espresso sm:text-4xl"
            >
              {item.name}
            </h2>
            {description ? (
              <p className="mt-4 max-w-sm text-base leading-7 text-muted">
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-4">
            {price ? (
              <p className="font-display text-3xl leading-none text-caramel-deep sm:text-4xl">
                {price}
              </p>
            ) : (
              <span />
            )}
            {!item.isAvailable ? (
              <span className="rounded-pill bg-closed-soft px-3 py-1.5 text-xs font-medium tracking-wide text-closed">
                לא זמין כרגע
              </span>
            ) : null}
          </div>
        </div>
      </article>
    </dialog>
  );
}
