"use client";

import { useSyncExternalStore } from "react";

import { ClockIcon } from "@/components/icons";
import type { Locale } from "@/config/locales";
import { siteConfig } from "@/config/site";
import {
  getWeekdayInTimeZone,
  getWeeklyHoursRows,
  isRestaurantOpen,
  WEEKDAYS,
  type OpeningHour,
  type WeekdayHoursRow,
} from "@/lib/opening-hours";

// The menu page is served from cache, so anything that depends on the time of
// day is worked out again in the browser. The first paint repeats what the
// server rendered (renderedAt), then the guest's clock takes over.
const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, MINUTE / 2);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function useNow(renderedAt: number): Date {
  const minute = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / MINUTE),
    () => Math.floor(renderedAt / MINUTE),
  );
  return new Date(minute * MINUTE);
}

type OpenStatusProps = {
  as?: "small" | "span";
  hours: OpeningHour[];
  renderedAt: number;
  openLabel: string;
  closedLabel: string;
};

export function OpenStatus({
  as: Tag = "span",
  hours,
  renderedAt,
  openLabel,
  closedLabel,
}: OpenStatusProps) {
  const isOpen = isRestaurantOpen(
    hours,
    useNow(renderedAt),
    siteConfig.timeZone,
  );
  return (
    <Tag className="st" data-open={isOpen ? "" : undefined}>
      {isOpen ? openLabel : closedLabel}
    </Tag>
  );
}

// 7 January 2024 was a Sunday, the first entry of WEEKDAYS.
function weekdayLabel(row: WeekdayHoursRow, locale: Locale): string {
  const offset = Math.max(0, WEEKDAYS.indexOf(row.day));
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, 0, 7 + offset)));
}

type HoursDetailsProps = {
  hours: OpeningHour[];
  renderedAt: number;
  locale: Locale;
  strings: { hours: string; open: string; closed: string; closedDay: string };
};

export function HoursDetails({
  hours,
  renderedAt,
  locale,
  strings,
}: HoursDetailsProps) {
  const now = useNow(renderedAt);
  const rows = getWeeklyHoursRows(
    hours,
    getWeekdayInTimeZone(now, siteConfig.timeZone),
  );
  if (rows.length === 0) {
    return null;
  }

  const isOpen = isRestaurantOpen(hours, now, siteConfig.timeZone);
  const today = rows.find((row) => row.isToday);
  const todayText = today
    ? today.isClosed
      ? strings.closedDay
      : today.ranges.join(" · ")
    : null;

  return (
    <details className="hrs">
      <summary>
        <ClockIcon />
        <span className="lb">{strings.hours}</span>
        {todayText ? <span className="td">{todayText}</span> : null}
        <span className="st" data-open={isOpen ? "" : undefined}>
          {isOpen ? strings.open : strings.closed}
        </span>
      </summary>
      <ul>
        {rows.map((row) => (
          <li key={row.day} data-today={row.isToday ? "" : undefined}>
            <span>{weekdayLabel(row, locale)}</span>
            <span>
              {row.isClosed ? strings.closedDay : row.ranges.join(" · ")}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
