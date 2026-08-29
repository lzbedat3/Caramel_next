"use client";

import Image from "next/image";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import {
  LOGO_ACCEPT,
  profileInputFromRow,
  validateLogoFile,
  validateProfileInput,
  type ProfileFieldErrors,
  type ProfileInput,
} from "@/lib/admin/profile";
import { cn } from "@/lib/cn";
import { isRemoteSvg } from "@/lib/storage-url";
import type { Tables } from "@/types/database";

import {
  saveRestaurantProfile,
  type SaveProfileState,
} from "./actions";

const idleSaveProfileState: SaveProfileState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

const inputClassName =
  "w-full rounded-control border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-caramel-deep";

type ProfileFormProps = {
  profile: Tables<"restaurant_profile"> | null;
  logoSrc: string | null;
};

type LogoAction = "keep" | "remove";

function snapshotOf(
  values: ProfileInput,
  logoAction: LogoAction,
  fileName: string,
) {
  return JSON.stringify({ values, logoAction, fileName });
}

function visibleErrors(
  serverErrors: ProfileFieldErrors,
  clientErrors: ProfileFieldErrors,
  dismissed: Partial<Record<keyof ProfileFieldErrors, true>>,
): ProfileFieldErrors {
  const merged: ProfileFieldErrors = { ...serverErrors, ...clientErrors };
  for (const key of Object.keys(dismissed) as (keyof ProfileFieldErrors)[]) {
    delete merged[key];
  }
  return merged;
}

export function ProfileForm({ profile, logoSrc }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    saveRestaurantProfile,
    idleSaveProfileState,
  );

  return (
    <ProfileEditor
      key={profile?.updated_at ?? "new"}
      profile={profile}
      logoSrc={logoSrc}
      formAction={formAction}
      pending={pending}
      state={state}
    />
  );
}

type ProfileEditorProps = {
  profile: Tables<"restaurant_profile"> | null;
  logoSrc: string | null;
  formAction: (payload: FormData) => void;
  pending: boolean;
  state: SaveProfileState;
};

function ProfileEditor({
  profile,
  logoSrc,
  formAction,
  pending,
  state,
}: ProfileEditorProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState(() => profileInputFromRow(profile));
  const [logoAction, setLogoAction] = useState<LogoAction>("keep");
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientErrors, setClientErrors] = useState<ProfileFieldErrors>({});
  const [dismissed, setDismissed] = useState<
    Partial<Record<keyof ProfileFieldErrors, true>>
  >({});
  const [baseline] = useState(() =>
    snapshotOf(profileInputFromRow(profile), "keep", ""),
  );

  const fieldErrors = visibleErrors(state.fieldErrors, clientErrors, dismissed);
  const dirty = snapshotOf(values, logoAction, fileName) !== baseline;
  const displayLogoSrc =
    previewUrl ?? (logoAction === "remove" ? null : logoSrc);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!dirty || pending) {
      return;
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, pending]);

  function dismiss(key: keyof ProfileFieldErrors) {
    setDismissed((current) =>
      current[key] ? current : { ...current, [key]: true },
    );
    setClientErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateField<K extends keyof ProfileInput>(
    key: K,
    value: ProfileInput[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    dismiss(key);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const error = validateLogoFile(file);
    if (error) {
      event.target.value = "";
      setClientErrors((current) => ({ ...current, logo: error }));
      setDismissed((current) => {
        if (!current.logo) {
          return current;
        }
        const next = { ...current };
        delete next.logo;
        return next;
      });
      return;
    }

    dismiss("logo");
    setLogoAction("keep");
    setFileName(file.name);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
  }

  function onRemoveLogo() {
    dismiss("logo");
    setLogoAction("remove");
    setFileName("");
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const wasActive = profile?.is_active !== false;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors = validateProfileInput(values);
    const selected = fileInputRef.current?.files?.[0];
    if (selected && selected.size > 0) {
      const logoError = validateLogoFile(selected);
      if (logoError) {
        nextErrors.logo = logoError;
      }
    }

    setDismissed({});
    setClientErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      return;
    }

    if (wasActive && !values.isActive) {
      const confirmed = window.confirm(
        "כיבוי הפרופיל יסתיר את האתר הציבורי, כולל התפריט, השעות, המדיה והקישורים. להמשיך?",
      );
      if (!confirmed) {
        event.preventDefault();
      }
    }
  }

  const nameId = `${formId}-name`;
  const subtitleId = `${formId}-subtitle`;
  const aboutId = `${formId}-about`;
  const addressId = `${formId}-address`;
  const wazeId = `${formId}-waze`;
  const phoneId = `${formId}-phone`;
  const emailId = `${formId}-email`;
  const logoId = `${formId}-logo`;
  const activeId = `${formId}-active`;

  return (
    <form
      noValidate
      action={formAction}
      onSubmit={onSubmit}
      aria-busy={pending}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="logo_action" value={logoAction} />

      <fieldset
        disabled={pending}
        className="rounded-card border border-border bg-surface px-5 py-5 sm:px-6"
      >
        <legend className="px-1 text-sm font-medium text-caramel-deep">
          זהות
        </legend>
        <div className="mt-4 flex flex-col gap-5">
          <Field
            id={nameId}
            label="שם המסעדה"
            error={fieldErrors.name}
            required
          >
            <input
              id={nameId}
              name="name"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              autoComplete="organization"
              required
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? `${nameId}-error` : undefined}
              className={inputClassName}
            />
          </Field>
          <Field id={subtitleId} label="תת־כותרת" error={fieldErrors.subtitle}>
            <input
              id={subtitleId}
              name="subtitle"
              value={values.subtitle}
              onChange={(event) => updateField("subtitle", event.target.value)}
              aria-invalid={Boolean(fieldErrors.subtitle)}
              aria-describedby={
                fieldErrors.subtitle ? `${subtitleId}-error` : undefined
              }
              className={inputClassName}
            />
          </Field>
          <Field
            id={aboutId}
            label="הסיפור"
            hint="טקסט חופשי שיופיע במקטע עלינו באתר."
            error={fieldErrors.about}
          >
            <textarea
              id={aboutId}
              name="about"
              rows={8}
              value={values.about}
              onChange={(event) => updateField("about", event.target.value)}
              aria-invalid={Boolean(fieldErrors.about)}
              aria-describedby={
                fieldErrors.about ? `${aboutId}-error` : `${aboutId}-hint`
              }
              className={cn(inputClassName, "min-h-48 resize-y leading-7")}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset
        disabled={pending}
        className="rounded-card border border-border bg-surface px-5 py-5 sm:px-6"
      >
        <legend className="px-1 text-sm font-medium text-caramel-deep">
          מיקום ויצירת קשר
        </legend>
        <div className="mt-4 flex flex-col gap-5">
          <Field id={addressId} label="כתובת" error={fieldErrors.address}>
            <input
              id={addressId}
              name="address"
              value={values.address}
              onChange={(event) => updateField("address", event.target.value)}
              autoComplete="street-address"
              aria-invalid={Boolean(fieldErrors.address)}
              aria-describedby={
                fieldErrors.address ? `${addressId}-error` : undefined
              }
              className={inputClassName}
            />
          </Field>
          <Field
            id={wazeId}
            label="קישור Waze"
            hint="חייב להתחיל ב-https:// או waze://"
            error={fieldErrors.wazeUrl}
          >
            <input
              id={wazeId}
              name="waze_url"
              type="text"
              dir="ltr"
              value={values.wazeUrl}
              onChange={(event) => updateField("wazeUrl", event.target.value)}
              inputMode="url"
              autoComplete="url"
              placeholder="https://waze.com/ul/..."
              aria-invalid={Boolean(fieldErrors.wazeUrl)}
              aria-describedby={
                fieldErrors.wazeUrl ? `${wazeId}-error` : `${wazeId}-hint`
              }
              className={inputClassName}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={phoneId} label="טלפון" error={fieldErrors.phone}>
              <input
                id={phoneId}
                name="phone"
                type="tel"
                dir="ltr"
                value={values.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                autoComplete="tel"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={
                  fieldErrors.phone ? `${phoneId}-error` : undefined
                }
                className={inputClassName}
              />
            </Field>
            <Field id={emailId} label="אימייל" error={fieldErrors.email}>
              <input
                id={emailId}
                name="email"
                type="email"
                dir="ltr"
                value={values.email}
                onChange={(event) => updateField("email", event.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email ? `${emailId}-error` : undefined
                }
                className={inputClassName}
              />
            </Field>
          </div>
        </div>
      </fieldset>

      <fieldset
        disabled={pending}
        className="rounded-card border border-border bg-surface px-5 py-5 sm:px-6"
      >
        <legend className="px-1 text-sm font-medium text-caramel-deep">
          לוגו
        </legend>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-warm ring-4 ring-background">
            {displayLogoSrc ? (
              previewUrl ? (
                // Local blob preview is not in the remote image loader.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayLogoSrc}
                  alt=""
                  className="size-full object-contain p-2"
                />
              ) : (
                <Image
                  src={displayLogoSrc}
                  alt={values.name ? `לוגו ${values.name}` : "לוגו המסעדה"}
                  fill
                  sizes="112px"
                  className="object-contain p-2"
                  unoptimized={isRemoteSvg(displayLogoSrc)}
                />
              )
            ) : (
              <span className="font-display text-3xl text-caramel-deep">
                {values.name.trim().charAt(0) || "•"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-6 text-muted">
              JPG, PNG, WebP, AVIF, GIF או SVG. עד 5MB. הקובץ נשמר בנתיב קבוע
              בבאקט branding.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                id={logoId}
                name="logo"
                type="file"
                accept={LOGO_ACCEPT}
                onChange={onFileChange}
                aria-invalid={Boolean(fieldErrors.logo)}
                aria-describedby={
                  fieldErrors.logo ? `${logoId}-error` : `${logoId}-hint`
                }
                className="peer sr-only"
              />
              <label
                htmlFor={logoId}
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center rounded-pill border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition hover:bg-surface-warm peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                  pending && "pointer-events-none opacity-60",
                )}
              >
                {displayLogoSrc ? "החלפת לוגו" : "העלאת לוגו"}
              </label>
              {displayLogoSrc || logoSrc ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onRemoveLogo}
                  disabled={
                    pending || (!displayLogoSrc && logoAction === "remove")
                  }
                >
                  הסרת לוגו
                </Button>
              ) : null}
            </div>
            <p id={`${logoId}-hint`} className="mt-2 text-xs text-muted-soft">
              אפשר לראות תצוגה מקדימה לפני השמירה. ההעלאה מתבצעת רק בלחיצה על
              שמירה.
            </p>
            {fieldErrors.logo ? (
              <p
                id={`${logoId}-error`}
                role="alert"
                className="mt-2 text-sm text-caramel-deep"
              >
                {fieldErrors.logo}
              </p>
            ) : null}
          </div>
        </div>
      </fieldset>

      <fieldset
        disabled={pending}
        className="rounded-card border border-border bg-surface px-5 py-5 sm:px-6"
      >
        <legend className="px-1 text-sm font-medium text-caramel-deep">
          תצוגה באתר
        </legend>
        <div className="mt-4">
          <label
            htmlFor={activeId}
            className="flex cursor-pointer items-start gap-3 rounded-control border border-border bg-surface-warm/50 px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            <input
              id={activeId}
              name="is_active"
              type="checkbox"
              checked={values.isActive}
              onChange={(event) =>
                updateField("isActive", event.target.checked)
              }
              className="mt-1 size-4 shrink-0 accent-caramel"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">
                פרופיל פעיל
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted">
                כשהפרופיל לא פעיל, האתר הציבורי מוסתר: שם, לוגו, תפריט, שעות,
                מדיה ראשית וקישורים חברתיים. מנועי חיפוש לא יאנדקסו את העמוד.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-6 text-sm">
          {pending ? (
            <p className="text-muted">שומר…</p>
          ) : state.status === "saved" && state.message && !dirty ? (
            <p className="text-open">{state.message}</p>
          ) : state.status === "error" && state.message ? (
            <p role="alert" className="text-caramel-deep">
              {state.message}
            </p>
          ) : dirty ? (
            <p className="text-muted-soft">יש שינויים שלא נשמרו</p>
          ) : null}
        </div>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "שומר…" : profile ? "שמירת שינויים" : "יצירת פרופיל"}
        </Button>
      </div>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

function Field({ id, label, error, hint, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="ms-1 text-caramel-deep" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs leading-5 text-muted-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-caramel-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}
