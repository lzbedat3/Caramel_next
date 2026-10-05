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
  locations: { id: number; name: string }[];
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

export function HoursManager({ hours, locations }: HoursManagerProps) {
  const [chosenId, setChosenId] = useState<number | null>(null);
  // The chosen branch, or the first one while none is chosen (or it was removed).
  const locationId =
    locations.find((location) => location.id === chosenId)?.id ??
    locations[0]?.id ??
    null;
  const [feedback, setFeedback] = useState<HoursActionState>(idleState);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const busy = busyKey !== null;
  const grouped = useMemo(
    () => groupByDay(hours.filter((row) => row.location_id === locationId)),
    [hours, locationId],
  );
  // Hours are saved for the branch on screen.
  const forLocation = (formData: FormData) => {
    formData.set("location_id", String(locationId ?? ""));
    return formData;
  };

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

      {locations.length > 1 ? (
        <div
          role="group"
          aria-label="סניף"
          className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto pb-0.5"
        >
          {locations.map((location) => (
            <button
              key={location.id}
              type="button"
              aria-pressed={location.id === locationId}
              onClick={() => setChosenId(location.id)}
              className={
                location.id === locationId
                  ? "rounded-pill border-caramel-soft bg-caramel-soft/30 text-caramel-deep focus-visible:ring-ring shrink-0 border px-4 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                  : "rounded-pill border-border text-muted hover:text-foreground focus-visible:ring-ring shrink-0 border px-4 py-2 text-sm transition focus-visible:ring-2 focus-visible:outline-none"
              }
            >
              {location.name}
            </button>
          ))}
        </div>
      ) : null}

      <div key={locationId} className="flex flex-col gap-4">
        {WEEKDAYS.map((day) => (
          <HoursDayCard
            key={day}
            day={day}
            rows={grouped[day] ?? []}
            disabled={busy}
            onCreate={(formData) =>
              run(`create-${day}`, () =>
                createHourInterval(forLocation(formData)),
              )
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
              run(`close-${day}`, () => markDayClosed(forLocation(formData)))
            }
          />
        ))}
      </div>
    </div>
  );
}
