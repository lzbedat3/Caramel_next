"use client";

import { useEffect, useRef } from "react";

import { pourTheme } from "@/config/pour-theme";
import { createPainter } from "@/features/pour/engine/pour";

type SplashProps = {
  brand: string[];
  /** The pool has formed: the menu's own pour can begin underneath. */
  onDrain: () => void;
  onDone: () => void;
};

const SESSION_KEY = "pour-splash";
const POUR_MS = 950;
const DRAIN_MS = 1750;
const END_MS = 2150;

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
// down the dark screen and gathers into a pool that carries the name. Then the
// page fades in beneath and its own pour continues from the brand.
export function Splash({ brand, onDrain, onDone }: SplashProps) {
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
    const poolTop = H * 0.46;
    // The stream: a gentle S from above the screen into the pool.
    const st = P.mkStrand();
    st.moveTo(cx, -40);
    st.bez(cx + W * 0.11, H * 0.14, cx - W * 0.11, H * 0.3, cx, poolTop);
    const poolIn = st.mark();
    st.lineTo(cx, poolTop + 70);
    const main = st.done(0.9);
    const sIn = main.S[poolIn] ?? main.len * 0.85;
    const pool = P.mkBlob(
      cx,
      0,
      Math.min(W * 0.4, 190),
      60,
      2.1,
      120,
      0.016,
      2.45,
    );
    P.shiftBlob(pool, poolTop - pool.topY);

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

      el.style.setProperty("--name", String(clamp((t - 1150) / 400, 0, 1)));

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
      <div className="splash-name" aria-hidden="true">
        {brand.map((part, index) => (
          <span key={index}>{part}</span>
        ))}
      </div>
    </div>
  );
}
