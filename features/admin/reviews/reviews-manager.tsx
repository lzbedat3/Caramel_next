"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { AdminReview } from "@/services/admin-reviews";

import {
  deleteReview,
  setReviewVisibility,
  type ReviewActionState,
} from "./actions";

const idleState: ReviewActionState = { status: "idle", message: null };

type Filter = "all" | "visible" | "hidden" | "low";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "הכול" },
  { id: "visible", label: "מוצגות" },
  { id: "hidden", label: "מוסתרות" },
  { id: "low", label: "עד 2 כוכבים" },
];

const dateFormat = new Intl.DateTimeFormat("he", {
  dateStyle: "medium",
  timeStyle: "short",
});

function Stars({ value }: { value: number }) {
  return (
    <span
      dir="ltr"
      className="text-caramel-deep text-sm tracking-wider"
      role="img"
      aria-label={`${value} מתוך 5 כוכבים`}
    >
      {"★".repeat(value)}
      <span className="text-muted-soft/50">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export function ReviewsManager({ reviews }: { reviews: AdminReview[] }) {
  const [feedback, setFeedback] = useState<ReviewActionState>(idleState);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirming, setConfirming] = useState<number | null>(null);

  const visible = reviews.filter((review) => review.is_visible);
  const average =
    visible.length > 0
      ? visible.reduce((sum, review) => sum + review.rating, 0) / visible.length
      : null;
  const shown = reviews.filter((review) =>
    filter === "visible"
      ? review.is_visible
      : filter === "hidden"
        ? !review.is_visible
        : filter === "low"
          ? review.rating <= 2
          : true,
  );

  async function run(
    id: number,
    action: (formData: FormData) => Promise<ReviewActionState>,
    extra?: (formData: FormData) => void,
  ) {
    const formData = new FormData();
    formData.set("id", String(id));
    extra?.(formData);
    setBusyId(id);
    setFeedback(idleState);
    try {
      setFeedback(await action(formData));
      setConfirming(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "דירוג ממוצע",
            value: average === null ? "-" : average.toFixed(1),
          },
          { label: "מוצגות באתר", value: String(visible.length) },
          {
            label: "מוסתרות",
            value: String(reviews.length - visible.length),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-card border-border bg-surface border px-4 py-3"
          >
            <p className="text-muted text-xs">{stat.label}</p>
            <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div
        role="group"
        aria-label="סינון ביקורות"
        className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto pb-0.5"
      >
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={filter === entry.id}
            onClick={() => setFilter(entry.id)}
            className={cn(
              "rounded-pill focus-visible:ring-ring shrink-0 border px-3 py-1.5 text-sm transition focus-visible:ring-2 focus-visible:outline-none",
              filter === entry.id
                ? "border-caramel-soft bg-caramel-soft/30 text-caramel-deep"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {busyId !== null ? (
          <p className="text-muted">מעדכן…</p>
        ) : feedback.status === "saved" && feedback.message ? (
          <p className="text-open">{feedback.message}</p>
        ) : feedback.status === "error" && feedback.message ? (
          <p role="alert" className="text-caramel-deep">
            {feedback.message}
          </p>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-card border-border bg-surface text-muted border px-5 py-6 text-sm leading-6">
          עדיין אין ביקורות. הן יופיעו כאן ברגע שאורחים יכתבו אותן בתחתית
          התפריט.
        </p>
      ) : shown.length === 0 ? (
        <p className="rounded-card border-border bg-surface text-muted border px-5 py-6 text-sm">
          אין ביקורות בסינון הזה.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((review) => {
            const busy = busyId === review.id;
            return (
              <li
                key={review.id}
                className={cn(
                  "rounded-card border-border bg-surface border px-4 py-4 sm:px-5",
                  !review.is_visible && "opacity-70",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-foreground font-medium">{review.name}</p>
                  <Stars value={review.rating} />
                  {review.is_visible ? null : (
                    <span className="rounded-pill bg-surface-warm text-muted px-2 py-0.5 text-xs">
                      מוסתרת
                    </span>
                  )}
                </div>
                {review.message ? (
                  <p className="text-foreground/90 mt-2 text-sm leading-6 break-words whitespace-pre-line">
                    {review.message}
                  </p>
                ) : null}
                <p className="text-muted-soft mt-2 text-xs">
                  {[
                    review.city,
                    review.locationName ? `סניף ${review.locationName}` : null,
                    dateFormat.format(new Date(review.created_at)),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    className="px-4 py-2"
                    onClick={() =>
                      void run(review.id, setReviewVisibility, (formData) => {
                        if (!review.is_visible) {
                          formData.set("is_visible", "on");
                        }
                      })
                    }
                  >
                    {review.is_visible ? "הסתרה מהאתר" : "הצגה באתר"}
                  </Button>
                  {confirming === review.id ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      className="text-closed px-4 py-2"
                      onClick={() => void run(review.id, deleteReview)}
                    >
                      למחוק לצמיתות
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy}
                      className="px-4 py-2"
                      onClick={() => setConfirming(review.id)}
                    >
                      מחיקה
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
