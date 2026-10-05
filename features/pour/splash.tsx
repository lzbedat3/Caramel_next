"use client";

import { useEffect, useRef } from "react";

import { brandAssets } from "@/config/brand-assets";
import { pourTheme } from "@/config/pour-theme";
import { createPainter } from "@/features/pour/engine/pour";

type SplashProps = {
  /** The pool has formed: the menu's own pour can begin underneath. */
  onDrain: () => void;
  onDone: () => void;
};

const SESSION_KEY = "pour-splash";
const POUR_MS = 950;
const DRAIN_MS = 2000;
const END_MS = 2400;

/** Whether the splash should play now: once per browser session, never under reduced motion. */
export function shouldPlaySplash(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  if (new URLSearchParams(window.location.search).has("nosplash")) {
    return false;
  }
  try {
    if (sessionStorage.getItem(SESSION_KEY)) {
      return false;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* no storage: play once per load */
  }
  return true;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
// 0 -> 1 with one soft bounce past 1.
const spring = (t: number) => 1 - Math.exp(-5 * t) * Math.cos(9 * t);

// The first pour: one stream of caramel, drawn with the menu's own material, runs
// down the dark screen and gathers into a round pool, and the logo rises out of
// it like a seal set in caramel. Then the page fades in beneath and its own
// pour continues from the brand.
export function Splash({ onDrain, onDone }: SplashProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onDrain, onDone });

  useEffect(() => {
    callbacks.current = { onDrain, onDone };
  }, [onDrain, onDone]);

  useEffect(() => {
    const cv = canvas.current;
    const el = root.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !el || !ctx) {
      callbacks.current.onDrain();
      callbacks.current.onDone();
      return;
    }

    const W = el.clientWidth;
    const H = el.clientHeight;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cv.style.width = `${W}px`;
    cv.style.height = `${H}px`;

    const P = createPainter(pourTheme, DPR);
    const cx = W / 2;
    // The badge, with a rim of caramel showing all around it.
    const logo = Math.round(Math.min(W * 0.62, H * 0.36, 280));
    const radius = logo / 2 + 13;
    const poolTop = H * 0.5 - radius;
    // The stream: a gentle S from above the screen into the pool.
    const st = P.mkStrand();
    st.moveTo(cx, -40);
    st.bez(cx + W * 0.11, H * 0.14, cx - W * 0.11, H * 0.3, cx, poolTop);
    const poolIn = st.mark();
    st.lineTo(cx, poolTop + 70);
    const main = st.done(0.9);
    const sIn = main.S[poolIn] ?? main.len * 0.85;
    const pool = P.mkBlob(cx, 0, radius, radius, 2.1, 140, 0.012, 2);
    P.shiftBlob(pool, poolTop - pool.topY);
    // The logo sits at the pool's true vertical centre, whatever its shape.
    el.style.setProperty("--pool-y", `${(pool.topY + pool.botY) / 2}px`);
    el.style.setProperty("--logo", `${logo}px`);

    let drained = false;
    let finished = false;
    let raf = 0;
    const t0 = performance.now();

    const frame = (now: number) => {
      const t = now - t0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const sh = main.len * easeInOut(clamp(t / POUR_MS, 0, 1));
      const arrived = clamp((sh - sIn) / (main.len - sIn), 0, 1);
      const settle = clamp((t - POUR_MS) / 700, 0, 1);
      const e = Math.max(0.2 * arrived, arrived * spring(settle));
      const head =
        sh < main.len - 0.5 ? { k: 1.6, neck: 0.12, glint: 1 } : null;
      const strands = sh > 1 ? [P.geom(main, 0, sh, head)] : [];
      const blobs = arrived > 0 ? [{ b: pool, e }] : [];
      P.drawScene(ctx, strands, blobs);

      // The logo surfaces as the pool settles: a fade with one soft bounce.
      const rise = clamp((t - 1050) / 650, 0, 1);
      el.style.setProperty("--logo-in", String(clamp(rise * 2.2, 0, 1)));
      el.style.setProperty("--logo-scale", String(0.8 + 0.2 * spring(rise)));

      if (!drained && t >= DRAIN_MS) {
        drained = true;
        callbacks.current.onDrain();
      }
      if (t >= END_MS) {
        if (!finished) {
          finished = true;
          callbacks.current.onDone();
        }
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={root}
      className="splash"
      role="presentation"
      onClick={() => {
        callbacks.current.onDrain();
        callbacks.current.onDone();
      }}
    >
      <canvas ref={canvas} className="splash-art" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="splash-logo"
        src={brandAssets.logo}
        alt=""
        aria-hidden="true"
        decoding="sync"
      />
    </div>
  );
}
