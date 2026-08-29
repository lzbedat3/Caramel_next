import { cn } from "@/lib/cn";
import type { WeekdayHoursRow } from "@/lib/opening-hours";

type HoursListProps = {
  rows: WeekdayHoursRow[];
};

export function HoursList({ rows }: HoursListProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div id="hours" className="scroll-mt-8">
      <p className="text-sm font-medium tracking-wide text-caramel-deep">
        מתי אנחנו כאן
      </p>
      <h2 className="font-display mt-3 text-3xl leading-tight text-foreground sm:text-4xl">
        שעות פתיחה
      </h2>
      <ul className="mt-6 space-y-1">
        {rows.map((row) => (
          <li
            key={row.day}
            className={cn(
              "flex items-baseline justify-between gap-4 rounded-pill px-3 py-2.5 text-sm sm:text-base",
              row.isToday && "bg-caramel-soft/55 shadow-soft",
            )}
          >
            <div className="min-w-0">
              <p
                className={cn(
                  "font-medium",
                  row.isToday ? "text-foreground" : "text-muted",
                )}
              >
                {row.isToday ? `${row.label} · היום` : row.label}
              </p>
              {row.notes.length > 0 ? (
                <p className="mt-1 text-xs leading-5 text-muted-soft">
                  {row.notes.join(" · ")}
                </p>
              ) : null}
            </div>
            <p
              className={cn(
                "shrink-0 text-end",
                row.isClosed ? "text-muted-soft" : "text-foreground",
              )}
            >
              {row.isClosed ? "סגור" : row.ranges.join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
