"use client";

import { useState, type FormEvent } from "react";

import { TranslationFields } from "@/components/admin/translation-fields";
import { Button } from "@/components/ui/button";
import type { LocationFieldErrors } from "@/lib/admin/location";
import {
  LOCATION_SLUG_MAX_LENGTH,
  normalizeLocationSlug,
} from "@/lib/admin/location";
import { cn } from "@/lib/cn";
import type { AdminLocation } from "@/services/admin-locations";

import {
  createLocation,
  deleteLocation,
  setLocationActive,
  updateLocation,
  type LocationActionState,
} from "./actions";

const idleState: LocationActionState = { status: "idle", message: null };

const inputClassName =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-caramel-deep";

type LocationsManagerProps = {
  locations: AdminLocation[];
  /** The public site address, without a trailing slash. */
  siteUrl: string;
};

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-caramel-deep text-sm">
          {error}
        </p>
      ) : hint ? (
        <p className="text-muted-soft text-xs leading-5">{hint}</p>
      ) : null}
    </div>
  );
}

type DetailsProps = {
  idPrefix: string;
  location?: AdminLocation;
  errors: LocationFieldErrors;
  disabled: boolean;
};

// The fields shared by "new branch" and "edit branch".
function LocationDetails({
  idPrefix,
  location,
  errors,
  disabled,
}: DetailsProps) {
  return (
    <>
      <Field id={`${idPrefix}-name`} label="שם הסניף" error={errors.name}>
        <input
          id={`${idPrefix}-name`}
          name="name"
          required
          defaultValue={location?.name ?? ""}
          placeholder="לדוגמה: עכו"
          disabled={disabled}
          aria-invalid={Boolean(errors.name)}
          className={inputClassName}
        />
      </Field>
      <Field id={`${idPrefix}-address`} label="כתובת">
        <input
          id={`${idPrefix}-address`}
          name="address"
          defaultValue={location?.address ?? ""}
          disabled={disabled}
          className={inputClassName}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={`${idPrefix}-phone`} label="טלפון">
          <input
            id={`${idPrefix}-phone`}
            name="phone"
            type="tel"
            dir="ltr"
            defaultValue={location?.phone ?? ""}
            disabled={disabled}
            className={inputClassName}
          />
        </Field>
        <Field
          id={`${idPrefix}-waze`}
          label="קישור ניווט (Waze)"
          error={errors.wazeUrl}
        >
          <input
            id={`${idPrefix}-waze`}
            name="waze_url"
            type="url"
            dir="ltr"
            defaultValue={location?.waze_url ?? ""}
            disabled={disabled}
            aria-invalid={Boolean(errors.wazeUrl)}
            className={inputClassName}
          />
        </Field>
      </div>
      <TranslationFields
        idPrefix={idPrefix}
        fields={[
          { name: "name", label: "שם הסניף" },
          { name: "address", label: "כתובת" },
        ]}
        values={location}
        disabled={disabled}
      />
    </>
  );
}

export function LocationsManager({
  locations,
  siteUrl,
}: LocationsManagerProps) {
  const [feedback, setFeedback] = useState<LocationActionState>(idleState);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [slugDraft, setSlugDraft] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const busy = busyKey !== null;
  const errorsFor = (key: string): LocationFieldErrors =>
    feedback.status === "error" && errorKey === key
      ? (feedback.fieldErrors ?? {})
      : {};
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function run(
    key: string,
    action: () => Promise<LocationActionState>,
  ): Promise<LocationActionState> {
    setBusyKey(key);
    setFeedback(idleState);
    try {
      const result = await action();
      setFeedback(result);
      setErrorKey(result.status === "error" ? key : null);
      return result;
    } finally {
      setBusyKey(null);
    }
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await run("create", () =>
      createLocation(new FormData(form)),
    );
    if (result.status === "saved") {
      form.reset();
      setSlugDraft("");
      setCreating(false);
    }
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(`save-${id}`, () => updateLocation(formData));
  }

  function withId(id: number, extra?: (formData: FormData) => void) {
    const formData = new FormData();
    formData.set("id", String(id));
    extra?.(formData);
    return formData;
  }

  async function copy(id: number, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      /* the address is selectable on the page anyway */
    }
  }

  return (
    <div className="flex flex-col gap-4">
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

      <ul className="flex flex-col gap-3">
        {locations.map((location) => {
          const url = `${siteUrl}/${location.slug}`;
          const open = openId === location.id;
          const qr = `/admin/locations/${location.id}/qr`;

          return (
            <li
              key={location.id}
              className={cn(
                "rounded-card bg-surface border transition-colors",
                open ? "border-caramel-soft" : "border-border",
              )}
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <a
                  href={`${qr}?format=svg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-visible:ring-ring mx-auto block size-28 shrink-0 overflow-hidden rounded-[1.1rem] bg-white p-1.5 focus-visible:ring-2 focus-visible:outline-none sm:mx-0"
                  aria-label={`קוד QR של סניף ${location.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${qr}?format=svg`}
                    alt=""
                    className="size-full"
                    loading="lazy"
                  />
                </a>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-foreground text-lg font-semibold">
                      {location.name}
                    </h2>
                    <span
                      className={cn(
                        "rounded-pill px-2 py-0.5 text-xs",
                        location.is_active
                          ? "bg-open-soft text-open"
                          : "bg-surface-warm text-muted",
                      )}
                    >
                      {location.is_active ? "מוצג באתר" : "מוסתר"}
                    </span>
                  </div>
                  {location.address ? (
                    <p className="text-muted mt-1 text-sm">
                      {location.address}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void copy(location.id, url)}
                    dir="ltr"
                    title="העתקת הכתובת"
                    className="rounded-control bg-surface-warm text-caramel-deep hover:bg-surface-warm/70 focus-visible:ring-ring mt-2 block max-w-full truncate px-2.5 py-1.5 text-start font-mono text-xs transition focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {copied === location.id ? "הכתובת הועתקה" : url}
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`${qr}?format=png&download`}
                      className="rounded-pill text-espresso focus-visible:ring-ring inline-flex items-center justify-center bg-[image:var(--gloss-caramel)] px-4 py-2 text-sm font-semibold shadow-[var(--shadow-gloss)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      הורדת QR להדפסה
                    </a>
                    <a
                      href={`${qr}?format=svg&download`}
                      className="rounded-pill border-border text-foreground hover:bg-surface-warm focus-visible:ring-ring inline-flex items-center justify-center border px-4 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none"
                    >
                      SVG לבית דפוס
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      className="px-4 py-2"
                      aria-expanded={open}
                      onClick={() => {
                        setOpenId(open ? null : location.id);
                        setConfirmingDelete(null);
                      }}
                    >
                      {open ? "סגירה" : "עריכה"}
                    </Button>
                  </div>
                </div>
              </div>

              {open ? (
                <form
                  key={location.updated_at}
                  onSubmit={(event) => void onUpdate(event, location.id)}
                  className="border-border flex flex-col gap-3 border-t p-4 sm:p-5"
                >
                  <input type="hidden" name="id" value={location.id} />
                  <LocationDetails
                    idPrefix={`location-${location.id}`}
                    location={location}
                    errors={errorsFor(`save-${location.id}`)}
                    disabled={busy}
                  />
                  <p className="text-muted-soft text-xs leading-5">
                    הכתובת{" "}
                    <span dir="ltr" className="font-mono">
                      /{location.slug}
                    </span>{" "}
                    קבועה ואינה ניתנת לשינוי, כדי שקודי QR שכבר הודפסו ימשיכו
                    לעבוד.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={busy} className="px-4 py-2">
                      {busyKey === `save-${location.id}` ? "שומר…" : "שמירה"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      className="px-4 py-2"
                      onClick={() =>
                        void run(`active-${location.id}`, () =>
                          setLocationActive(
                            withId(location.id, (formData) => {
                              if (!location.is_active) {
                                formData.set("is_active", "on");
                              }
                            }),
                          ),
                        )
                      }
                    >
                      {location.is_active ? "הסתרה מהאתר" : "הצגה באתר"}
                    </Button>
                    {locations.length > 1 ? (
                      confirmingDelete === location.id ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          className="text-closed px-4 py-2"
                          onClick={() =>
                            void run(`delete-${location.id}`, () =>
                              deleteLocation(withId(location.id)),
                            )
                          }
                        >
                          למחוק את הסניף ואת שעות הפתיחה שלו
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          className="px-4 py-2"
                          onClick={() => setConfirmingDelete(location.id)}
                        >
                          מחיקה
                        </Button>
                      )
                    ) : null}
                  </div>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>

      {creating ? (
        <form
          onSubmit={(event) => void onCreate(event)}
          className="rounded-card border-caramel-soft bg-surface flex flex-col gap-3 border p-4 sm:p-5"
        >
          <h2 className="text-foreground text-base font-medium">סניף חדש</h2>
          <LocationDetails
            idPrefix="location-new"
            errors={errorsFor("create")}
            disabled={busy}
          />
          <Field
            id="location-new-slug"
            label="כתובת הסניף באתר"
            error={errorsFor("create").slug}
            hint="באותיות אנגליות. זו הכתובת שתודפס בקוד ה-QR, ואי אפשר לשנות אותה אחר כך."
          >
            <div
              dir="ltr"
              className="rounded-control border-border bg-surface focus-within:ring-ring flex items-center overflow-hidden border focus-within:ring-2"
            >
              <span className="text-muted shrink-0 truncate ps-3 font-mono text-xs">
                {siteUrl.replace(/^https?:\/\//, "")}/
              </span>
              <input
                id="location-new-slug"
                name="slug"
                required
                value={slugDraft}
                onChange={(event) =>
                  setSlugDraft(
                    event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-"),
                  )
                }
                onBlur={() => setSlugDraft(normalizeLocationSlug(slugDraft))}
                maxLength={LOCATION_SLUG_MAX_LENGTH}
                placeholder="haifa"
                autoCapitalize="none"
                spellCheck={false}
                disabled={busy}
                aria-invalid={Boolean(errorsFor("create").slug)}
                className="text-foreground min-w-0 flex-1 bg-transparent px-1 py-2.5 font-mono text-sm outline-none"
              />
            </div>
          </Field>
          <label className="text-foreground flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked
              className="size-4 accent-[var(--caramel)]"
            />
            להציג את הסניף באתר מיד
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="px-4 py-2">
              {busyKey === "create" ? "מוסיף…" : "הוספת הסניף"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              className="px-4 py-2"
              onClick={() => setCreating(false)}
            >
              ביטול
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-card border-border text-caramel-deep hover:border-caramel-soft hover:bg-surface focus-visible:ring-ring border border-dashed px-5 py-5 text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none"
        >
          הוספת סניף
        </button>
      )}
    </div>
  );
}
