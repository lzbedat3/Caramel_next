"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  firstHourError,
  HOUR_NOTE_MAX_LENGTH,
  validateHourNote,
  validateOpenInterval,
  type HourIntervalFieldErrors,
} from "@/lib/admin/hours";
import { cn } from "@/lib/cn";
import {
  WEEKDAY_LABELS_HE,
  type OpeningHour,
  type Weekday,
} from "@/lib/opening-hours";

import type { HoursActionState } from "./actions";
import { HoursIntervalFields, hoursInputClassName } from "./hours-interval-fields";
import { HoursIntervalRow } from "./hours-interval-row";

type HoursDayCardProps = {
  day: Weekday;
  rows: OpeningHour[];
  disabled: boolean;
  onCreate: (formData: FormData) => Promise<HoursActionState>;
  onUpdate: (formData: FormData) => Promise<HoursActionState>;
  onDelete: (formData: FormData) => Promise<HoursActionState>;
  onMove: (id: number, direction: "up" | "down") => Promise<HoursActionState>;
  onMarkClosed: (formData: FormData) => Promise<HoursActionState>;
};

export function HoursDayCard({
  day,
  rows,
  disabled,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
  onMarkClosed,
}: HoursDayCardProps) {
  const formId = useId();
  const closedRows = rows.filter((row) => row.is_closed);
  const intervals = rows.filter((row) => !row.is_closed);
  const isClosed = rows.length > 0 && intervals.length === 0;
  const closedRow = closedRows[0];
  const [adding, setAdding] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [addErrors, setAddErrors] = useState<HourIntervalFieldErrors>({});
  const [closedNoteError, setClosedNoteError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = disabled || saving;
  const addId = `${formId}-add`;
  const closedNoteId = `${formId}-closed-note`;

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("day_of_week", day);
    const fieldErrors = validateOpenInterval(
      {
        opensAt: String(formData.get("opens_at") ?? ""),
        closesAt: String(formData.get("closes_at") ?? ""),
        note: String(formData.get("note") ?? ""),
      },
      intervals,
    );

    if (firstHourError(fieldErrors)) {
      setAddErrors(fieldErrors);
      return;
    }

    setAddErrors({});
    setSaving(true);
    const result = await onCreate(formData);
    if (result.status === "saved") {
      form.reset();
      setAdding(false);
    }
    setSaving(false);
  }

  async function onSaveClosedNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!closedRow) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const noteError = validateHourNote(String(formData.get("note") ?? ""));
    if (noteError) {
      setClosedNoteError(noteError);
      return;
    }

    setClosedNoteError(null);
    formData.set("id", String(closedRow.id));
    formData.set("is_closed", "on");
    setSaving(true);
    await onUpdate(formData);
    setSaving(false);
  }

  async function submitMarkClosed() {
    const formData = new FormData();
    formData.set("day_of_week", day);
    if (closedRow?.note) {
      formData.set("note", closedRow.note);
    }
    setSaving(true);
    const result = await onMarkClosed(formData);
    if (result.status === "saved") {
      setConfirmingClose(false);
      setAdding(false);
    }
    setSaving(false);
  }

  async function unmarkClosed() {
    if (!closedRow) {
      return;
    }

    const formData = new FormData();
    formData.set("id", String(closedRow.id));
    setSaving(true);
    await onDelete(formData);
    setSaving(false);
  }

  return (
    <section className="rounded-card border border-border bg-surface px-4 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium text-foreground">
          {WEEKDAY_LABELS_HE[day]}
        </h2>
        {isClosed ? (
          <span className="rounded-pill bg-surface-warm px-2 py-0.5 text-xs text-muted">
            סגור
          </span>
        ) : intervals.length > 1 ? (
          <span className="rounded-pill bg-open-soft px-2 py-0.5 text-xs text-open">
            {intervals.length} משמרות
          </span>
        ) : null}
      </div>

      {isClosed && closedRow ? (
        <div className="mb-4 rounded-control border border-border bg-surface-warm px-3 py-3">
          <p className="text-sm font-medium text-foreground">היום סגור</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            באתר הציבורי יום זה יוצג כסגור.
          </p>
          <form onSubmit={onSaveClosedNote} className="mt-3 flex flex-col gap-2">
            <label htmlFor={closedNoteId} className="text-sm font-medium text-foreground">
              הערה
            </label>
            <input
              id={closedNoteId}
              name="note"
              defaultValue={closedRow.note ?? ""}
              disabled={busy}
              maxLength={HOUR_NOTE_MAX_LENGTH}
              aria-invalid={Boolean(closedNoteError)}
              className={hoursInputClassName}
            />
            {closedNoteError ? (
              <p role="alert" className="text-sm text-caramel-deep">
                {closedNoteError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy} className="px-4 py-2">
                שמירת הערה
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                className="px-4 py-2"
                onClick={() => {
                  void unmarkClosed();
                }}
              >
                ביטול סגירה
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {!isClosed && intervals.length === 0 ? (
        <p className="mb-3 text-sm leading-6 text-muted">
          לא הוגדרו שעות ליום זה. הוא לא יופיע ברשימה הציבורית עד שתוסיפו משמרת
          או תסמנו אותו כסגור.
        </p>
      ) : null}

      {intervals.length > 0 ? (
        <div className="mb-3 flex flex-col gap-3">
          {intervals.map((row, index) => (
            <HoursIntervalRow
              key={`${row.id}-${row.updated_at}`}
              row={row}
              otherIntervals={intervals.filter((item) => item.id !== row.id)}
              isFirst={index === 0}
              isLast={index === intervals.length - 1}
              disabled={busy}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onMove={(direction) => onMove(row.id, direction)}
            />
          ))}
        </div>
      ) : null}

      {adding ? (
        <form
          onSubmit={onAdd}
          aria-busy={busy}
          className={cn(
            "mb-3 rounded-control border border-dashed border-border px-3 py-3 sm:px-4",
            isClosed && "bg-surface",
          )}
        >
          <p className="mb-3 text-sm font-medium text-foreground">משמרת חדשה</p>
          {isClosed ? (
            <p className="mb-3 text-xs leading-5 text-muted">
              הוספת משמרת תבטל את סימון הסגירה ליום זה.
            </p>
          ) : null}
          <HoursIntervalFields
            idPrefix={addId}
            disabled={busy}
            errors={addErrors}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" disabled={busy} className="px-4 py-2">
              {saving ? "שומר…" : "הוספת משמרת"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              className="px-4 py-2"
              onClick={() => {
                setAdding(false);
                setAddErrors({});
              }}
            >
              ביטול
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className="px-4 py-2"
            onClick={() => setAdding(true)}
          >
            הוספת משמרת
          </Button>
          {!isClosed ? (
            confirmingClose ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-caramel-deep">
                  {intervals.length > 0
                    ? "סימון כסגור ימחק את המשמרות הקיימות ביום זה."
                    : "לסמן את היום כסגור?"}
                </p>
                <Button
                  type="button"
                  disabled={busy}
                  className="px-4 py-2"
                  onClick={() => {
                    void submitMarkClosed();
                  }}
                >
                  אישור סגירה
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  className="px-4 py-2"
                  onClick={() => setConfirmingClose(false)}
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
                onClick={() => setConfirmingClose(true)}
              >
                סימון כסגור
              </Button>
            )
          ) : null}
        </div>
      )}
    </section>
  );
}
