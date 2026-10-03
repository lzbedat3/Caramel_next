"use client";

import { useCallback, useEffect, useRef } from "react";

import type { StageDish } from "@/features/pour/pour-stage";
import type { Dictionary } from "@/lib/i18n";

type DishDialogProps = {
  dish: StageDish | null;
  originRef: React.RefObject<HTMLElement | null>;
  strings: Dictionary;
  onAdd: (id: number) => void;
  onClosed: () => void;
};

const CLOSE_MS = 600;

// The dish grows out of its ring into a framed photo, and shrinks back into it.
export function DishDialog({
  dish,
  originRef,
  strings,
  onAdd,
  onClosed,
}: DishDialogProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const info = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  const setFrame = useCallback(
    (
      rect: { left: number; top: number; width: number; height: number },
      radius: string,
      padding: number,
      innerRadius: string,
    ) => {
      const el = frame.current;
      if (!el || !inner.current) {
        return;
      }
      el.style.left = `${rect.left}px`;
      el.style.top = `${rect.top}px`;
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      el.style.borderRadius = radius;
      el.style.padding = `${padding}px`;
      inner.current.style.borderRadius = innerRadius;
    },
    [],
  );

  const close = useCallback(() => {
    const origin = originRef.current;
    if (!dish || !origin || closing.current) {
      return;
    }
    closing.current = true;
    overlay.current?.classList.remove("open");
    setFrame(origin.getBoundingClientRect(), "50%", 0, "50%");
    window.setTimeout(() => {
      overlay.current?.classList.remove("on");
      origin.style.visibility = "";
      origin.focus({ preventScroll: true });
      closing.current = false;
      onClosed();
    }, CLOSE_MS);
  }, [dish, originRef, onClosed, setFrame]);

  useEffect(() => {
    const ov = overlay.current;
    const el = frame.current;
    const text = info.current;
    const origin = originRef.current;
    if (!dish || !origin || !ov || !el || !text) {
      return;
    }

    const rect = origin.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    el.style.transition = "none";
    setFrame(rect, "50%", 0, "50%");
    ov.classList.add("on");
    origin.style.visibility = "hidden";

    const width = Math.min(vw - 28, 400);
    const height = Math.round(width * 0.75);
    text.style.width = `${width}px`;
    text.style.left = `${(vw - width) / 2}px`;
    const block = height + 28 + text.offsetHeight;
    const top = Math.min(
      Math.max(rect.top + rect.height / 2 - height / 2, 70),
      Math.max(70, vh - block - 28),
    );
    text.style.top = `${top + height + 28}px`;
    void el.offsetWidth; // commit the starting frame before animating
    el.style.transition = "";
    setFrame(
      { left: (vw - width) / 2, top, width, height },
      "36px",
      11,
      "25px",
    );
    ov.classList.add("open");
    closeButton.current?.focus({ preventScroll: true });
  }, [dish, originRef, setFrame]);

  useEffect(() => {
    const ov = overlay.current;
    if (!dish || !ov) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };
    const block = (event: Event) => event.preventDefault();
    document.addEventListener("keydown", onKey);
    ov.addEventListener("wheel", block, { passive: false });
    ov.addEventListener("touchmove", block, { passive: false });
    return () => {
      document.removeEventListener("keydown", onKey);
      ov.removeEventListener("wheel", block);
      ov.removeEventListener("touchmove", block);
    };
  }, [dish, close]);

  function add(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!dish || !dish.isAvailable || closing.current) {
      return;
    }

    const id = dish.id;
    const from = event.currentTarget.getBoundingClientRect();
    const drop = document.createElement("div");
    drop.className = "ct-drop";
    drop.style.left = `${from.left + from.width / 2}px`;
    drop.style.top = `${from.top + from.height / 2}px`;
    overlay.current?.parentElement?.appendChild(drop);
    const fall = window.innerHeight - 60 - (from.top + from.height / 2);
    const done = () => {
      drop.remove();
      onAdd(id);
      navigator.vibrate?.(12);
    };
    if (typeof drop.animate === "function") {
      drop.animate(
        [
          { transform: "translateY(0) scale(1.7,1.3)" },
          {
            transform: `translateY(${fall * 0.5}px) scale(.8,2.5)`,
            offset: 0.6,
          },
          {
            transform: `translateY(${fall}px) scale(1.6,.7)`,
            opacity: 0.6,
          },
        ],
        { duration: 560, easing: "cubic-bezier(.5,0,.8,.6)" },
      ).onfinish = done;
    } else {
      done();
    }
    window.setTimeout(close, 260);
  }

  return (
    <div
      id="ov"
      ref={overlay}
      role="dialog"
      aria-modal="true"
      aria-label={dish?.name}
      aria-hidden={!dish}
      onClick={(event) => {
        event.stopPropagation();
        close();
      }}
    >
      <div className="bk" />
      <div id="xf" ref={frame}>
        <div className="in" ref={inner}>
          {dish?.detail ? (
            // The optimised sources are prepared on the server with next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={dish.id}
              alt=""
              src={dish.detail.src}
              srcSet={dish.detail.srcSet}
              sizes={dish.detail.sizes}
            />
          ) : null}
        </div>
      </div>
      <div id="xi" ref={info}>
        <small>{dish?.categoryName}</small>
        <h2>{dish?.name}</h2>
        <p>{dish?.description}</p>
        {dish?.price ? (
          <div className="xp">
            <i>{dish.price.symbol}</i>
            <b>{dish.price.amount}</b>
          </div>
        ) : null}
        <button
          id="xadd"
          type="button"
          disabled={!dish?.isAvailable}
          onClick={add}
        >
          {dish && !dish.isAvailable ? strings.unavailable : strings.addToTable}
        </button>
      </div>
      <button
        id="xc"
        ref={closeButton}
        type="button"
        aria-label={strings.close}
      />
    </div>
  );
}
