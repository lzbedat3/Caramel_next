"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

import { siteConfig } from "@/config/site";
import {
  formatTodayHoursLabel,
  isRestaurantOpen,
  type OpeningHour,
} from "@/lib/opening-hours";
import { cn } from "@/lib/cn";

type OpenStatusProps = {
  hours: OpeningHour[];
};

const TICK_MS = 30_000;

function subscribeToClock(onStoreChange: () => void) {
  const timer = window.setInterval(onStoreChange, TICK_MS);
  return () => window.clearInterval(timer);
}

function getClockSnapshot() {
  return Math.floor(Date.now() / TICK_MS) * TICK_MS;
}

function getServerClockSnapshot() {
  return 0;
}

export function OpenStatus({ hours }: OpenStatusProps) {
  const reduceMotion = useReducedMotion();
  const nowMs = useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getServerClockSnapshot,
  );

  const hasHours = hours.length > 0;
  const now = nowMs === 0 ? null : new Date(nowMs);
  const hoursLabel = now
    ? formatTodayHoursLabel(hours, now, siteConfig.timeZone)
    : null;
  const isOpen = now
    ? isRestaurantOpen(hours, now, siteConfig.timeZone)
    : false;

  if (!hasHours) {
    return (
      <div className="max-w-52 text-end text-sm leading-6 text-muted">
        השעות יופיעו כאן כשיתעדכנו במערכת
      </div>
    );
  }

  if (!now) {
    return (
      <div
        className="flex flex-wrap items-center justify-end gap-2"
        aria-hidden="true"
      >
        <span className="inline-flex h-[2.125rem] w-16 rounded-pill bg-surface-warm" />
        <span className="inline-flex h-[2.125rem] w-28 max-w-full rounded-pill bg-surface-warm/70" />
      </div>
    );
  }

  const statusLabel = isOpen ? "פתוח" : "סגור";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={statusLabel}
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={cn(
            "badge-status",
            isOpen ? "badge-status-open" : "badge-status-closed",
          )}
          aria-live="polite"
        >
          {statusLabel}
        </motion.span>
      </AnimatePresence>
      {hoursLabel ? (
        <p
          className={cn(
            "badge-hours m-0 tabular-nums",
            isOpen ? "badge-hours-open" : "badge-hours-closed",
          )}
        >
          {hoursLabel}
        </p>
      ) : null}
    </div>
  );
}
