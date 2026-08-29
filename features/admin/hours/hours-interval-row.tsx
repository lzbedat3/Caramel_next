"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  firstHourError,
  timeToInputValue,
  validateOpenInterval,
  type HourIntervalFieldErrors,
} from "@/lib/admin/hours";
import type { OpeningHour } from "@/lib/opening-hours";

import type { HoursActionState } from "./actions";
import { HoursIntervalFields } from "./hours-interval-fields";

type HoursIntervalRowProps = {
  row: OpeningHour;
  otherIntervals: OpeningHour[];
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onUpdate: (formData: FormData) => Promise<HoursActionState>;
  onDelete: (formData: FormData) => Promise<HoursActionState>;
  onMove: (direction: "up" | "down") => Promise<HoursActionState>;
};

export function HoursIntervalRow({
  row,
  otherIntervals,
  isFirst,
  isLast,
  disabled,
  onUpdate,
  onDelete,
  onMove,
}: HoursIntervalRowProps) {
  const formId = useId();
  const [errors, setErrors] = useState<HourIntervalFieldErrors>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = disabled || saving;
  const showMove = !(isFirst && isLast);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fieldErrors = validateOpenInterval(
      {
        opensAt: String(formData.get("opens_at") ?? ""),
        closesAt: String(formData.get("closes_at") ?? ""),
        note: String(formData.get("note") ?? ""),
      },
      otherIntervals,
    );

    if (firstHourError(fieldErrors)) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    const result = await onUpdate(formData);
    if (result.status === "saved") {
      setConfirmingDelete(false);
    }
    setSaving(false);
  }

  async function confirmDelete() {
    const formData = new FormData();
    formData.set("id", String(row.id));
    setSaving(true);
    await onDelete(formData);
    setSaving(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={busy}
      className="rounded-control border border-border bg-surface px-3 py-3 sm:px-4"
    >
      <input type="hidden" name="id" value={row.id} />
      <HoursIntervalFields
        idPrefix={formId}
        opensAt={timeToInputValue(row.opens_at)}
        closesAt={timeToInputValue(row.closes_at)}
        note={row.note ?? ""}
        disabled={busy}
        errors={errors}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" disabled={busy} className="px-4 py-2">
          {saving ? "שומר…" : "שמירה"}
        </Button>
        {showMove ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={busy || isFirst}
              className="px-4 py-2"
              onClick={() => {
                void onMove("up");
              }}
            >
              למעלה
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || isLast}
              className="px-4 py-2"
              onClick={() => {
                void onMove("down");
              }}
            >
              למטה
            </Button>
          </>
        ) : null}
        {confirmingDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-caramel-deep">למחוק את המשמרת?</p>
            <Button
              type="button"
              disabled={busy}
              className="px-4 py-2"
              onClick={() => {
                void confirmDelete();
              }}
            >
              אישור מחיקה
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              className="px-4 py-2"
              onClick={() => setConfirmingDelete(false)}
            >
              ביטול
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            className="px-4 py-2"
            onClick={() => setConfirmingDelete(true)}
          >
            מחיקה
          </Button>
        )}
      </div>
    </form>
  );
}
