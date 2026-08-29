import {
  formatClock,
  parseTimeToMinutes,
  WEEKDAYS,
  type Weekday,
} from "@/lib/opening-hours";

export const HOUR_NOTE_MAX_LENGTH = 200;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export function isWeekday(value: string): value is Weekday {
  return WEEKDAYS.includes(value as Weekday);
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function timeToInputValue(value: string | null): string {
  if (!value) {
    return "";
  }

  return formatClock(value);
}

export function parseTimeInput(
  raw: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "יש להזין שעה" };
  }

  if (!TIME_RE.test(trimmed)) {
    return { ok: false, error: "שעה לא תקינה" };
  }

  const [hours = "00", minutes = "00"] = trimmed.split(":");
  return { ok: true, value: `${hours}:${minutes}:00` };
}

export type HourIntervalInput = {
  opensAt: string;
  closesAt: string;
  note: string;
};

export type HourIntervalFieldErrors = Partial<
  Record<"opensAt" | "closesAt" | "note" | "interval", string>
>;

function isOvernight(opensAt: string, closesAt: string): boolean {
  return parseTimeToMinutes(closesAt) < parseTimeToMinutes(opensAt);
}

export function openIntervalsOverlap(
  aOpen: string,
  aClose: string,
  bOpen: string,
  bClose: string,
): boolean {
  if (isOvernight(aOpen, aClose) || isOvernight(bOpen, bClose)) {
    return false;
  }

  const aStart = parseTimeToMinutes(aOpen);
  const aEnd = parseTimeToMinutes(aClose);
  const bStart = parseTimeToMinutes(bOpen);
  const bEnd = parseTimeToMinutes(bClose);

  return aStart < bEnd && bStart < aEnd;
}

export function validateHourNote(note: string): string | null {
  if (note.trim().length > HOUR_NOTE_MAX_LENGTH) {
    return `ההערה ארוכה מדי (עד ${HOUR_NOTE_MAX_LENGTH} תווים)`;
  }

  return null;
}

export function validateOpenInterval(
  input: HourIntervalInput,
  otherIntervals: Array<{ opens_at: string | null; closes_at: string | null }>,
): HourIntervalFieldErrors {
  const errors: HourIntervalFieldErrors = {};
  const opens = parseTimeInput(input.opensAt);
  const closes = parseTimeInput(input.closesAt);
  const noteError = validateHourNote(input.note);

  if (!opens.ok) {
    errors.opensAt = opens.error;
  }

  if (!closes.ok) {
    errors.closesAt = closes.error;
  }

  if (noteError) {
    errors.note = noteError;
  }

  if (opens.ok && closes.ok) {
    if (opens.value === closes.value) {
      errors.interval = "שעת הפתיחה והסגירה אינן יכולות להיות זהות";
    } else {
      const overlap = otherIntervals.some((row) => {
        if (!row.opens_at || !row.closes_at) {
          return false;
        }

        return openIntervalsOverlap(
          opens.value,
          closes.value,
          row.opens_at,
          row.closes_at,
        );
      });

      if (overlap) {
        errors.interval = "המשמרת חופפת למשמרת אחרת באותו יום";
      }
    }
  }

  return errors;
}

export function firstHourError(
  errors: HourIntervalFieldErrors,
): string | null {
  return (
    errors.opensAt ?? errors.closesAt ?? errors.interval ?? errors.note ?? null
  );
}
