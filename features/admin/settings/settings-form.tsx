"use client";

import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import {
  siteSettingsInputFromRow,
  type SiteSettingsFieldErrors,
} from "@/lib/admin/site-settings";
import { cn } from "@/lib/cn";
import {
  SEO_DESCRIPTION_MAX_LENGTH,
  SEO_TITLE_MAX_LENGTH,
} from "@/lib/seo";
import type { AdminSiteSettings } from "@/services/admin-settings";

import {
  saveSiteSettings,
  type SaveSettingsState,
} from "./actions";

const idleSaveSettingsState: SaveSettingsState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

const inputClassName =
  "w-full rounded-control border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-caramel-deep";

type SettingsFormProps = {
  settings: AdminSiteSettings | null;
  derivedTitle: string;
  derivedDescription: string;
  restaurantActive: boolean;
};

export function SettingsForm({
  settings,
  derivedTitle,
  derivedDescription,
  restaurantActive,
}: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    saveSiteSettings,
    idleSaveSettingsState,
  );

  return (
    <SettingsEditor
      key={settings?.updated_at ?? "new"}
      settings={settings}
      derivedTitle={derivedTitle}
      derivedDescription={derivedDescription}
      restaurantActive={restaurantActive}
      formAction={formAction}
      pending={pending}
      state={state}
    />
  );
}

type SettingsEditorProps = SettingsFormProps & {
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: SaveSettingsState;
};

function SettingsEditor({
  settings,
  derivedTitle,
  derivedDescription,
  restaurantActive,
  formAction,
  pending,
  state,
}: SettingsEditorProps) {
  const formId = useId();
  const titleId = `${formId}-title`;
  const descriptionId = `${formId}-description`;
  const initial = siteSettingsInputFromRow(settings);
  const errors: SiteSettingsFieldErrors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div aria-live="polite" className="min-h-6 text-sm">
        {pending ? (
          <p className="text-muted">שומר…</p>
        ) : state.status === "saved" && state.message ? (
          <p className="text-open">{state.message}</p>
        ) : state.status === "error" && state.message ? (
          <p role="alert" className="text-caramel-deep">
            {state.message}
          </p>
        ) : null}
      </div>

      <section className="rounded-card border border-border bg-surface px-5 py-5 sm:px-6">
        <h2 className="text-base font-medium text-foreground">כתובת האתר</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          כתובת קנונית לייצור מטא־דאטה, מפת האתר ו־robots. מגיעה מהגדרת הסביבה,
          לא מעריכת הפרופיל.
        </p>
        <p
          dir="ltr"
          className="mt-4 rounded-control border border-border bg-surface-warm px-4 py-3 font-mono text-sm text-foreground"
        >
          {siteConfig.url}
        </p>
      </section>

      <section className="rounded-card border border-border bg-surface px-5 py-5 sm:px-6">
        <h2 className="text-base font-medium text-foreground">אינדוקס</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          {restaurantActive
            ? "הפרופיל פעיל. דף הבית הציבורי מאונדקס, ופורטל הניהול נשאר מחוץ לאינדוקס."
            : "הפרופיל אינו פעיל. דף הבית לא יאונדקס עד שהמסעדה תופעל בפרופיל."}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          שם, תיאור, כתובת ולוגו מנוהלים ב
          <a
            href={routes.adminProfile}
            className="mx-1 text-caramel-deep underline-offset-2 hover:underline"
          >
            פרופיל המסעדה
          </a>
          .
        </p>
      </section>

      <section className="rounded-card border border-border bg-surface px-5 py-5 sm:px-6">
        <h2 className="text-base font-medium text-foreground">SEO</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          שדות אופציונליים לדף הבית. אם ריקים, ייעשה שימוש בשם המסעדה ובתת־הכותרת
          או בטקסט האודות.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={titleId} className="text-sm font-medium text-foreground">
              כותרת לדף הבית
            </label>
            <input
              id={titleId}
              name="seo_title"
              defaultValue={initial.seoTitle}
              disabled={pending}
              maxLength={SEO_TITLE_MAX_LENGTH}
              placeholder={derivedTitle}
              aria-invalid={Boolean(errors.seoTitle)}
              className={cn(inputClassName)}
            />
            {errors.seoTitle ? (
              <p role="alert" className="text-sm text-caramel-deep">
                {errors.seoTitle}
              </p>
            ) : (
              <p className="text-xs leading-5 text-muted-soft">
                עד {SEO_TITLE_MAX_LENGTH} תווים. ברירת מחדל: {derivedTitle}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={descriptionId}
              className="text-sm font-medium text-foreground"
            >
              תיאור לדף הבית
            </label>
            <textarea
              id={descriptionId}
              name="seo_description"
              defaultValue={initial.seoDescription}
              disabled={pending}
              maxLength={SEO_DESCRIPTION_MAX_LENGTH}
              rows={4}
              placeholder={derivedDescription}
              aria-invalid={Boolean(errors.seoDescription)}
              className={cn(inputClassName, "min-h-28 resize-y")}
            />
            {errors.seoDescription ? (
              <p role="alert" className="text-sm text-caramel-deep">
                {errors.seoDescription}
              </p>
            ) : (
              <p className="text-xs leading-5 text-muted-soft">
                עד {SEO_DESCRIPTION_MAX_LENGTH} תווים. ברירת מחדל:{" "}
                {derivedDescription}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <Button type="submit" disabled={pending}>
            {pending ? "שומר…" : "שמירת הגדרות"}
          </Button>
        </div>
      </section>
    </form>
  );
}
