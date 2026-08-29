import type { Enums, Tables } from "@/types/database";

export type Weekday = Enums<"weekday">;
export type OpeningHour = Tables<"opening_hours">;

export const WEEKDAYS: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DEFAULT_IMAGE_DURATION_MS = 7000;

export function getWeekdayInTimeZone(date: Date, timeZone: string): Weekday {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone,
  })
    .format(date)
    .toLowerCase();

  if (!WEEKDAYS.includes(weekday as Weekday)) {
    return "sunday";
  }

  return weekday as Weekday;
}

export function previousWeekday(day: Weekday): Weekday {
  const index = WEEKDAYS.indexOf(day);
  return WEEKDAYS[(index + 6) % 7] ?? "saturday";
}

export function parseTimeToMinutes(value: string): number {
  const [hours = "0", minutes = "0", seconds = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes) + Number(seconds) / 60;
}

export function minutesInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );
  const second = Number(
    parts.find((part) => part.type === "second")?.value ?? 0,
  );

  return hour * 60 + minute + second / 60;
}

export function formatClock(value: string): string {
  const [hours = "00", minutes = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

function isOvernightSlot(opensAt: string, closesAt: string): boolean {
  return parseTimeToMinutes(closesAt) <= parseTimeToMinutes(opensAt);
}

function isNowWithinSlot(
  nowMinutes: number,
  opensAt: string,
  closesAt: string,
): boolean {
  const start = parseTimeToMinutes(opensAt);
  const end = parseTimeToMinutes(closesAt);

  if (end > start) {
    return nowMinutes >= start && nowMinutes < end;
  }

  return nowMinutes >= start || nowMinutes < end;
}

export function getOpenSlotsForDay(
  hours: OpeningHour[],
  day: Weekday,
): OpeningHour[] {
  return hours
    .filter(
      (row) =>
        row.day_of_week === day &&
        !row.is_closed &&
        Boolean(row.opens_at) &&
        Boolean(row.closes_at),
    )
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }

      return (a.opens_at ?? "").localeCompare(b.opens_at ?? "");
    });
}

export function isClosedAllDay(hours: OpeningHour[], day: Weekday): boolean {
  const rows = hours.filter((row) => row.day_of_week === day);
  return (
    rows.length > 0 &&
    rows.every((row) => row.is_closed || !row.opens_at || !row.closes_at)
  );
}

export function isRestaurantOpen(
  hours: OpeningHour[],
  now: Date,
  timeZone: string,
): boolean {
  const today = getWeekdayInTimeZone(now, timeZone);
  const yesterday = previousWeekday(today);
  const nowMinutes = minutesInTimeZone(now, timeZone);

  for (const row of getOpenSlotsForDay(hours, today)) {
    if (
      row.opens_at &&
      row.closes_at &&
      isNowWithinSlot(nowMinutes, row.opens_at, row.closes_at)
    ) {
      return true;
    }
  }

  for (const row of getOpenSlotsForDay(hours, yesterday)) {
    if (
      row.opens_at &&
      row.closes_at &&
      isOvernightSlot(row.opens_at, row.closes_at) &&
      nowMinutes < parseTimeToMinutes(row.closes_at)
    ) {
      return true;
    }
  }

  return false;
}

export function formatHourRange(row: OpeningHour): string | null {
  if (!row.opens_at || !row.closes_at || row.is_closed) {
    return null;
  }

  return `${formatClock(row.opens_at)}–${formatClock(row.closes_at)}`;
}

export function formatTodayHoursLabel(
  hours: OpeningHour[],
  now: Date,
  timeZone: string,
): string | null {
  const today = getWeekdayInTimeZone(now, timeZone);
  const slots = getOpenSlotsForDay(hours, today)
    .map(formatHourRange)
    .filter((value): value is string => Boolean(value));

  if (slots.length > 0) {
    return slots.join(" · ");
  }

  if (isClosedAllDay(hours, today)) {
    return "סגור היום";
  }

  return null;
}

export const WEEKDAY_LABELS_HE: Record<Weekday, string> = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
  friday: "שישי",
  saturday: "שבת",
};

export type WeekdayHoursRow = {
  day: Weekday;
  label: string;
  isToday: boolean;
  isClosed: boolean;
  ranges: string[];
  notes: string[];
};

export function getWeeklyHoursRows(
  hours: OpeningHour[],
  today: Weekday,
): WeekdayHoursRow[] {
  return WEEKDAYS.flatMap((day) => {
    const rows = hours.filter((row) => row.day_of_week === day);
    if (rows.length === 0) {
      return [];
    }

    const ranges = getOpenSlotsForDay(hours, day)
      .map(formatHourRange)
      .filter((value): value is string => Boolean(value));
    const notes = [
      ...new Set(
        rows
          .map((row) => row.note?.trim())
          .filter((note): note is string => Boolean(note)),
      ),
    ];

    return [
      {
        day,
        label: WEEKDAY_LABELS_HE[day],
        isToday: day === today,
        isClosed: ranges.length === 0,
        ranges,
        notes,
      },
    ];
  });
}

export function getHeroSlideDurationMs(
  durationSeconds: number | null,
  type: "image" | "video",
): number {
  const seconds = Number(durationSeconds);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds * 1000;
  }

  return type === "image" ? DEFAULT_IMAGE_DURATION_MS : 10_000;
}
