"use client";

import { useMemo, useState } from "react";

import { WEEKDAYS, type OpeningHour, type Weekday } from "@/lib/opening-hours";
import type { AdminOpeningHour } from "@/services/admin-hours";

import {
  createHourInterval,
  deleteHourInterval,
  markDayClosed,
  moveHourInterval,
  updateHourInterval,
  type HoursActionState,
} from "./actions";
import { HoursDayCard } from "./hours-day-card";

const idleState: HoursActionState = { status: "idle", message: null };

type HoursManagerProps = {
  hours: AdminOpeningHour[];
};

function groupByDay(hours: OpeningHour[]): Record<Weekday, OpeningHour[]> {
  const groups = {} as Record<Weekday, OpeningHour[]>;
  for (const day of WEEKDAYS) {
    groups[day] = [];
  }

  for (const row of hours) {
    const bucket = groups[row.day_of_week];
    if (bucket) {
      bucket.push(row);
    }
  }

  return groups;
}

export function HoursManager({ hours }: HoursManagerProps) {
  const [feedback, setFeedback] = useState<HoursActionState>(idleState);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const busy = busyKey !== null;
  const grouped = useMemo(() => groupByDay(hours), [hours]);

  async function run(
    key: string,
    action: () => Promise<HoursActionState>,
  ): Promise<HoursActionState> {
    setBusyKey(key);
    setFeedback(idleState);
    try {
      const result = await action();
      setFeedback(result);
      return result;
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite" className="min-h-6 text-sm">
        {busy ? (
          <p className="text-muted">מעדכן…</p>
        ) : feedback.status === "saved" && feedback.message ? (
          <p className="text-open">{feedback.message}</p>
        ) : feedback.status === "error" && feedback.message ? (
          <p role="alert" className="text-caramel-deep">
            {feedback.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {WEEKDAYS.map((day) => (
          <HoursDayCard
            key={day}
            day={day}
            rows={grouped[day] ?? []}
            disabled={busy}
            onCreate={(formData) =>
              run(`create-${day}`, () => createHourInterval(formData))
            }
            onUpdate={(formData) =>
              run(`save-${String(formData.get("id"))}`, () =>
                updateHourInterval(formData),
              )
            }
            onDelete={(formData) =>
              run(`delete-${String(formData.get("id"))}`, () =>
                deleteHourInterval(formData),
              )
            }
            onMove={(id, direction) => {
              const formData = new FormData();
              formData.set("id", String(id));
              formData.set("direction", direction);
              return run(`move-${id}`, () => moveHourInterval(formData));
            }}
            onMarkClosed={(formData) =>
              run(`close-${day}`, () => markDayClosed(formData))
            }
          />
        ))}
      </div>
    </div>
  );
}
