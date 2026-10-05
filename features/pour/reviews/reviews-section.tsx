"use client";

import { useActionState, useEffect, useState } from "react";

import type { Locale } from "@/config/locales";
import { format, type Dictionary } from "@/lib/i18n";
import {
  REVIEW_CITY_MAX,
  REVIEW_MESSAGE_MAX,
  REVIEW_NAME_MAX,
  type PublicReview,
  type PublicReviews,
} from "@/lib/reviews";

import { submitReview, type ReviewFormState } from "./actions";

const idle: ReviewFormState = { status: "idle" };
const FIRST = 3;

type ReviewsSectionProps = {
  reviews: PublicReviews;
  locale: Locale;
  locationId: number | null;
  strings: Dictionary;
};

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          aria-hidden="true"
          data-on={star <= Math.round(value) ? "" : undefined}
        >
          <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
        </svg>
      ))}
    </span>
  );
}

// What guests said, and a short form to add to it. It sits under the menu, in
// normal page flow, so it never moves the pour or the dishes above it.
export function ReviewsSection({
  reviews,
  locale,
  locationId,
  strings,
}: ReviewsSectionProps) {
  const [state, formAction, pending] = useActionState(submitReview, idle);
  const [writing, setWriting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [rating, setRating] = useState(0);
  // When the form was opened: forms sent implausibly fast are ignored.
  const [started, setStarted] = useState(0);
  const [mine, setMine] = useState<PublicReview[]>([]);

  useEffect(() => {
    if (state.status !== "saved") {
      return;
    }
    // Shown at once; the cached page picks it up for everyone else.
    const timer = window.setTimeout(() => {
      const added = state.review;
      if (added) {
        setMine((current) => [added, ...current]);
      }
      setWriting(false);
      setRating(0);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [state]);

  // Sending a review refreshes the page data, so the stored copy can arrive
  // while the guest's own copy is still held here: keep only one of them.
  const unsynced = mine.filter(
    (own) =>
      !reviews.latest.some(
        (stored) =>
          stored.name === own.name &&
          Math.abs(Date.parse(stored.createdAt) - Date.parse(own.createdAt)) <
            5000,
      ),
  );
  const list = [...unsynced, ...reviews.latest];
  const count = reviews.count + unsynced.length;
  const total =
    (reviews.average ?? 0) * reviews.count +
    unsynced.reduce((sum, review) => sum + review.rating, 0);
  const average = count > 0 ? Math.round((total / count) * 10) / 10 : null;
  const shown = showAll ? list : list.slice(0, FIRST);
  const dateFormat = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <section id="reviews" aria-labelledby="reviews-title">
      <h2 id="reviews-title">{strings.reviewsTitle}</h2>

      {average === null ? (
        <p className="rv-empty">{strings.reviewsEmpty}</p>
      ) : (
        <div className="rv-sum">
          <b dir="ltr">{average.toFixed(1)}</b>
          <span>
            <Stars
              value={average}
              label={format(strings.reviewStars, { count: average.toFixed(1) })}
            />
            <small>
              {count === 1
                ? strings.reviewsOne
                : format(strings.reviewsCount, { count })}
            </small>
          </span>
        </div>
      )}

      {shown.length > 0 ? (
        <ul>
          {shown.map((review) => (
            <li key={review.id}>
              <div className="rv-head">
                <b>{review.name}</b>
                <Stars
                  value={review.rating}
                  label={format(strings.reviewStars, { count: review.rating })}
                />
              </div>
              {review.message ? <p>{review.message}</p> : null}
              <small>
                {[review.city, dateFormat.format(new Date(review.createdAt))]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
              {review.reply ? (
                <div className="rv-reply">
                  <b>{strings.reviewReply}</b>
                  <p>{review.reply}</p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {list.length > FIRST && !showAll ? (
        <button
          type="button"
          className="rv-more"
          onClick={() => setShowAll(true)}
        >
          {format(strings.reviewsCount, { count: list.length })}
        </button>
      ) : null}

      {state.status === "saved" && !writing ? (
        <p className="rv-note" role="status">
          {strings.reviewThanks}
        </p>
      ) : null}

      {writing ? (
        <form action={formAction} className="rv-form">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="location_id" value={locationId ?? ""} />
          <input type="hidden" name="started" value={started} />
          <input type="hidden" name="rating" value={rating || ""} />
          {/* Left empty by people; filled by scripts that complete every field. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="rv-trap"
          />

          <div
            className="rv-rate"
            role="radiogroup"
            aria-label={strings.reviewRating}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={format(strings.reviewStars, { count: star })}
                data-on={star <= rating ? "" : undefined}
                onClick={() => setRating(star)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" />
                </svg>
              </button>
            ))}
          </div>

          <div className="rv-row">
            <label>
              <span>{strings.reviewName}</span>
              <input
                name="name"
                required
                minLength={2}
                maxLength={REVIEW_NAME_MAX}
                autoComplete="given-name"
              />
            </label>
            <label>
              <span>{strings.reviewCity}</span>
              <input
                name="city"
                maxLength={REVIEW_CITY_MAX}
                autoComplete="address-level2"
              />
            </label>
          </div>
          <label>
            <span>{strings.reviewMessage}</span>
            <textarea name="message" rows={3} maxLength={REVIEW_MESSAGE_MAX} />
          </label>

          {state.status === "invalid" || state.status === "error" ? (
            <p className="rv-note" role="alert" data-error="">
              {state.status === "invalid"
                ? strings.reviewInvalid
                : strings.reviewError}
            </p>
          ) : null}

          <div className="rv-actions">
            <button
              type="submit"
              className="rv-send"
              disabled={pending || rating === 0}
            >
              {pending ? strings.reviewSending : strings.reviewSend}
            </button>
            <button
              type="button"
              className="rv-cancel"
              onClick={() => setWriting(false)}
            >
              {strings.reviewCancel}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="rv-write"
          onClick={() => {
            setStarted(Date.now());
            setWriting(true);
          }}
        >
          {strings.reviewWrite}
        </button>
      )}
    </section>
  );
}
