"use client";

import { useEffect, useRef } from "react";

import { pourTheme } from "@/config/pour-theme";
import { createPainter } from "@/features/pour/engine/pour";

const POUR_MS = 900;
const SETTLE_MS = 700;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
// 0 -> 1 with one soft bounce past 1.
const spring = (t: number) => 1 - Math.exp(-5 * t) * Math.cos(9 * t);

// The sign-in screen's own pour: the menu's caramel runs down from the top of
// the screen and pools behind the logo, drawn with the same engine and material.
export function PortalPour() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const scene = cv?.parentElement;
    const ctx = cv?.getContext("2d");
    if (!cv || !scene || !ctx) {
      return;
    }

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let started = 0;

    const paint = (now: number) => {
      const logo = scene.querySelector<HTMLElement>("[data-pour-target]");
      if (!logo) {
        return;
      }
      const W = scene.clientWidth;
      const H = scene.clientHeight;
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      if (
        cv.width !== Math.round(W * DPR) ||
        cv.height !== Math.round(H * DPR)
      ) {
        cv.width = Math.round(W * DPR);
        cv.height = Math.round(H * DPR);
        cv.style.width = `${W}px`;
        cv.style.height = `${H}px`;
      }

      const box = logo.getBoundingClientRect();
      const origin = scene.getBoundingClientRect();
      const cx = box.left - origin.left + box.width / 2;
      const cy = box.top - origin.top + box.height / 2;
      const radius = box.width / 2 + 11;
      const poolTop = cy - radius;

      const P = createPainter(pourTheme, DPR);
      const st = P.mkStrand();
      st.moveTo(cx, -40);
      st.bez(
        cx + W * 0.1,
        poolTop * 0.3,
        cx - W * 0.1,
        poolTop * 0.68,
        cx,
        poolTop,
      );
      const poolIn = st.mark();
      st.lineTo(cx, poolTop + 60);
      const main = st.done(0.9);
      const sIn = main.S[poolIn] ?? main.len * 0.85;
      const pool = P.mkBlob(cx, 0, radius, radius, 2.1, 140, 0.012, 2);
      P.shiftBlob(pool, poolTop - pool.topY);

      const t = still ? POUR_MS + SETTLE_MS : now - started;
      const sh = main.len * easeInOut(clamp(t / POUR_MS, 0, 1));
      const arrived = clamp((sh - sIn) / (main.len - sIn), 0, 1);
      const settle = clamp((t - POUR_MS) / SETTLE_MS, 0, 1);
      const e = Math.max(0.2 * arrived, arrived * spring(settle));
      const head =
        sh < main.len - 0.5 ? { k: 1.6, neck: 0.12, glint: 1 } : null;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      P.drawScene(
        ctx,
        sh > 1 ? [P.geom(main, 0, sh, head)] : [],
        arrived > 0 ? [{ b: pool, e }] : [],
      );

      // The logo surfaces as the pool settles.
      const rise = clamp((t - POUR_MS * 0.85) / 600, 0, 1);
      scene.style.setProperty("--logo-in", String(clamp(rise * 2.2, 0, 1)));
      scene.style.setProperty("--logo-scale", String(0.8 + 0.2 * spring(rise)));

      if (t < POUR_MS + SETTLE_MS + 400) {
        raf = requestAnimationFrame(paint);
      } else {
        raf = 0;
        scene.dataset.poured = "";
      }
    };

    const start = () => {
      started = performance.now();
      raf = requestAnimationFrame(paint);
    };
    // After the first run, a resize simply redraws the finished pour in place.
    const onResize = () => {
      if (!raf) {
        started = performance.now() - (POUR_MS + SETTLE_MS + 400);
        raf = requestAnimationFrame(paint);
      }
    };

    start();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvas} className="portal-pour" aria-hidden="true" />;
}
