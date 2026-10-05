"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { pourTheme } from "@/config/pour-theme";
import { createPainter } from "@/features/pour/engine/pour";

type CategoryNavProps = {
  categories: {
    id: number;
    name: string;
    image: { src: string; srcSet?: string } | null;
  }[];
  active: number;
  show: boolean;
  label: string;
  onJump: (index: number) => void;
};

// The sticky bar: a pool of caramel, painted with the menu's own material,
// slides under the active category's name like a drop finding its place. A
// category with a picture shows it above its name.
export function CategoryNav({
  categories,
  active,
  show,
  label,
  onJump,
}: CategoryNavProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const nav = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  // Where the pool is and where it is going, in nav pixels.
  const pos = useRef({ x: 0, w: 0, tx: 0, tw: 0, vx: 0, vw: 0, y: 22, ry: 16 });
  const raf = useRef(0);
  const painter = useRef<ReturnType<typeof createPainter> | null>(null);
  const drawRef = useRef<() => void>(() => {});

  const target = useCallback(() => {
    const button = buttons.current[active];
    const el = nav.current;
    if (!button || !el) {
      return;
    }
    // With a picture the pool sits under the name alone; without, under the button.
    const name = button.querySelector<HTMLElement>("span");
    const stacked = Boolean(name && button.querySelector("img"));
    pos.current.tx = button.offsetLeft + button.offsetWidth / 2;
    pos.current.tw =
      stacked && name ? name.offsetWidth + 24 : button.offsetWidth;
    pos.current.y =
      stacked && name
        ? button.offsetTop + name.offsetTop + name.offsetHeight / 2
        : button.offsetTop + button.offsetHeight / 2;
    pos.current.ry = stacked ? 13 : 16;
    if (pos.current.w === 0) {
      pos.current.x = pos.current.tx;
      pos.current.w = pos.current.tw;
    }
    el.scrollTo({
      left: button.offsetLeft - (el.clientWidth - button.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  const draw = useCallback(() => {
    const cv = canvas.current;
    const el = nav.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !el || !ctx) {
      return;
    }
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const width = el.scrollWidth;
    const height = el.clientHeight;
    if (
      cv.width !== Math.round(width * DPR) ||
      cv.height !== Math.round(height * DPR)
    ) {
      cv.width = Math.round(width * DPR);
      cv.height = Math.round(height * DPR);
      cv.style.width = `${width}px`;
      cv.style.height = `${height}px`;
      painter.current = createPainter(pourTheme, DPR);
    }
    const P =
      painter.current ?? (painter.current = createPainter(pourTheme, DPR));
    const s = pos.current;
    // A light spring with a little overshoot, and a stretch while moving.
    s.vx = (s.vx + (s.tx - s.x) * 0.16) * 0.72;
    s.vw = (s.vw + (s.tw - s.w) * 0.16) * 0.72;
    s.x += s.vx;
    s.w += s.vw;
    const stretch = Math.min(26, Math.abs(s.vx) * 1.6);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const blob = P.mkBlob(
      s.x,
      s.y,
      s.w / 2 + 1 + stretch,
      s.ry,
      2.6,
      72,
      0.006,
      2.2,
    );
    blob.ax = s.x;
    blob.ay = s.y;
    P.drawScene(ctx, [], [{ b: blob, e: 1 }]);

    const settled =
      Math.abs(s.tx - s.x) < 0.2 &&
      Math.abs(s.tw - s.w) < 0.2 &&
      Math.abs(s.vx) < 0.05;
    raf.current = settled ? 0 : requestAnimationFrame(() => drawRef.current());
  }, []);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  const kick = useCallback(() => {
    if (!raf.current) {
      raf.current = requestAnimationFrame(() => drawRef.current());
    }
  }, []);

  useLayoutEffect(() => {
    target();
    kick();
    const onResize = () => {
      target();
      kick();
    };
    window.addEventListener("resize", onResize);
    // Button widths change once the web fonts arrive.
    void document.fonts?.ready.then(onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [target, kick, categories]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      // Cleared, so a later kick can start the loop again.
      raf.current = 0;
    },
    [],
  );

  if (categories.length < 2) {
    return null;
  }

  return (
    <nav
      id="nav"
      ref={nav}
      className={show ? "show" : undefined}
      aria-label={label}
    >
      <canvas ref={canvas} aria-hidden="true" />
      {categories.map((category, index) => (
        <button
          key={category.id}
          type="button"
          className={index === active ? "on" : undefined}
          aria-current={index === active ? "true" : undefined}
          ref={(node) => {
            buttons.current[index] = node;
          }}
          onClick={() => onJump(index)}
        >
          {category.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              src={category.image.src}
              srcSet={category.image.srcSet}
              width={52}
              height={52}
              decoding="async"
            />
          ) : null}
          <span>{category.name}</span>
        </button>
      ))}
    </nav>
  );
}
